from supabase import create_client, Client
from dotenv import load_dotenv
import os
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import OneHotEncoder
import numpy as np

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def train_model():
    from datetime import datetime
    
    # 1. Fetch ALL businesses from business_raw
    resp = supabase.table("business_raw").select(
        "business_id, business_name, general_category, latitude, longitude, street, zone_type, status"
    ).execute()

    rows = resp.data

    if not rows or len(rows) == 0:
        return {
            "status": "error",
            "trigger": "raw_data_change",
            "active_processed": 0,
            "inactive_ignored_in_ml": 0,
            "enhanced_table": "businesses",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": "No rows found in business_raw"
        }

    df = pd.DataFrame(rows)
    
    # Normalize status to lowercase for comparison
    df["status"] = df["status"].str.lower()

    # Separate active and inactive businesses
    df_active = df[df["status"] == "active"].copy()
    df_inactive = df[df["status"] == "inactive"].copy()
    
    active_count = len(df_active)
    inactive_count = len(df_inactive)

    if active_count < 2:
        return {
            "status": "error",
            "trigger": "raw_data_change",
            "active_processed": active_count,
            "inactive_ignored_in_ml": inactive_count,
            "enhanced_table": "businesses",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": "Not enough active businesses to train model (need at least 2)"
        }

    # 2. Prepare features (ONLY for active businesses)
    encoder = OneHotEncoder(sparse=False)
    cat_encoded = encoder.fit_transform(df_active[["general_category"]])

    features = np.column_stack([
        df_active["latitude"].astype(float),
        df_active["longitude"].astype(float),
        cat_encoded
    ])

    # 3. Determine optimal k using elbow method
    inertia_vals = []
    K_RANGE = range(2, min(10, active_count))

    for k in K_RANGE:
        kmeans = KMeans(n_clusters=k, random_state=42)
        kmeans.fit(features)
        inertia_vals.append(kmeans.inertia_)

    # Best elbow (simple approach)
    optimal_k = K_RANGE[np.argmin(np.gradient(inertia_vals))]

    # 4. Train final model
    kmeans = KMeans(n_clusters=optimal_k, random_state=42)
    clusters = kmeans.fit_predict(features)

    df_active["cluster"] = clusters

    # 5. Generate enhanced ML columns for ACTIVE businesses
    df_active["distance_to_center"] = [
        float(np.linalg.norm(features[i] - kmeans.cluster_centers_[clusters[i]]))
        for i in range(len(df_active))
    ]

    # Business density (cluster population)
    cluster_counts = df_active["cluster"].value_counts().to_dict()
    df_active["business_density"] = df_active["cluster"].map(cluster_counts)

    # Competitor density (same category, same cluster)
    competitor_density = []
    for i, row in df_active.iterrows():
        same = df_active[
            (df_active["cluster"] == row["cluster"]) &
            (df_active["general_category"] == row["general_category"])
        ]
        competitor_density.append(len(same))
    df_active["competitor_density"] = competitor_density

    # Category distribution (per cluster)
    category_distribution = {}
    for cl in sorted(df_active["cluster"].unique()):
        subset = df_active[df_active["cluster"] == cl]
        category_distribution[cl] = (
            subset["general_category"].value_counts(normalize=True).to_dict()
        )

    df_active["category_distribution"] = df_active["cluster"].map(category_distribution)

    # Add cluster center (lat, lng only)
    df_active["cluster_center"] = [
        {
            "latitude": float(kmeans.cluster_centers_[cluster][0]),
            "longitude": float(kmeans.cluster_centers_[cluster][1])
        }
        for cluster in df_active["cluster"]
    ]

    # 6. Handle INACTIVE businesses (store but mark as inactive, no ML features)
    if inactive_count > 0:
        # Add placeholder ML columns to inactive rows
        df_inactive["cluster"] = None
        df_inactive["distance_to_center"] = None
        df_inactive["business_density"] = None
        df_inactive["competitor_density"] = None
        df_inactive["category_distribution"] = None
        df_inactive["cluster_center"] = None

    # 7. Combine active and inactive
    df_all = pd.concat([df_active, df_inactive], ignore_index=True)

    # 8. Clear existing enhanced table
    supabase.table("businesses").delete().neq("business_id", "").execute()

    # 9. UPSERT enhanced rows
    enhanced_rows = df_all.to_dict(orient="records")
    for row in enhanced_rows:
        supabase.table("businesses").insert(row).execute()

    return {
        "status": "success",
        "trigger": "raw_data_change",
        "active_processed": active_count,
        "inactive_ignored_in_ml": inactive_count,
        "enhanced_table": "businesses",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
