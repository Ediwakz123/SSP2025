import { supabase } from "./lib/supabaseClient.js";

async function debug() {
    console.log("Checking Supabase connection...");

    // Try to select from a known table 'businesses'
    const { data: businesses, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .limit(1);

    if (businessError) {
        console.error("Error accessing 'businesses' table:", businessError);
    } else {
        console.log("Successfully accessed 'businesses' table.");
    }

    // Try to select from 'business_raw'
    console.log("Checking 'business_raw' table...");
    const { data: raw, error: rawError } = await supabase
        .from("business_raw")
        .select("*")
        .limit(1);

    if (rawError) {
        console.error("Error accessing 'business_raw' table:", rawError);
        console.error("Details:", JSON.stringify(rawError, null, 2));
    } else {
        console.log("Successfully accessed 'business_raw' table. Rows:", raw.length);
    }

    // Try to select from 'clustering_results'
    console.log("Checking 'clustering_results' table...");
    const { data: clusters, error: clusterError } = await supabase
        .from("clustering_results")
        .select("*")
        .limit(1);

    if (clusterError) {
        console.error("Error accessing 'clustering_results' table:", clusterError);
    } else {
        console.log("Successfully accessed 'clustering_results' table.");
        if (clusters.length > 0) {
            console.log("Columns:", Object.keys(clusters[0]));
        } else {
            console.log("No rows in 'clustering_results'.");
        }
    }
}

debug();
