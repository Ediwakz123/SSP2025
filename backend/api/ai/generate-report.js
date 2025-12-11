import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const {
            userName,
            businessIdea,
            category,
            bestCluster,
            recommendedLocation,
            clusterSummary,
            topBusinesses,
            confidence,
            confidenceLabel,
            finalSuggestion,
        } = req.body;

        if (!userName || !businessIdea) {
            return res.status(400).json({ error: "Missing required data" });
        }

        // Format date
        const reportDate = new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Generate PDF content directly (no AI needed for formatting)
        const pdfContent = generatePDFContent({
            userName,
            businessIdea,
            category,
            bestCluster,
            recommendedLocation,
            clusterSummary,
            topBusinesses,
            confidence,
            confidenceLabel,
            confidenceColor: bestCluster?.confidenceColor,
            finalSuggestion,
            reportDate,
        });

        // Generate Excel data structure
        const excelContent = generateExcelContent({
            userName,
            businessIdea,
            bestCluster,
            recommendedLocation,
            clusterSummary,
            topBusinesses,
            confidence,
            confidenceLabel,
            finalSuggestion,
        });

        return res.status(200).json({
            success: true,
            pdfContent,
            excelContent,
        });

    } catch (err) {
        console.error("Report Generation Error:", err.message);
        return res.status(500).json({ error: "Report generation failed", message: err.message });
    }
}

function generatePDFContent(data) {
    const {
        userName,
        businessIdea,
        category,
        bestCluster,
        recommendedLocation,
        clusterSummary,
        topBusinesses,
        confidence,
        confidenceLabel,
        confidenceColor,
        finalSuggestion,
        reportDate,
    } = data;

    // Helper to sanitize text for PDF (remove problematic characters)
    const sanitize = (text) => {
        if (!text) return "";
        return String(text)
            .replace(/[\u2018\u2019]/g, "'")  // Smart quotes to regular
            .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
            .replace(/[\u2013\u2014]/g, '-')  // Em/en dash to hyphen
            .replace(/\u2022/g, '-')          // Bullet to dash
            .replace(/[^\x00-\x7F]/g, (char) => {
                // Keep peso sign and common chars
                if (char === '₱') return 'PHP ';
                return '';
            });
    };

    // Get color name from hex
    const getColorName = (hex) => {
        switch (hex) {
            case "#E63946": return "Red";
            case "#F4A261": return "Orange";
            case "#2A9D8F": return "Teal";
            case "#2ECC71": return "Green";
            default: return "Teal";
        }
    };

    const colorName = getColorName(confidenceColor || bestCluster?.confidenceColor);
    const confLabel = confidenceLabel || bestCluster?.confidenceLabel || "Good Choice";
    const confValue = confidence || bestCluster?.confidence || 80;

    let content = "";

    // Header Section
    content += "BUSINESS LOCATION ANALYSIS REPORT\n";
    content += "==================================\n\n";
    content += "Prepared for: " + sanitize(userName) + "\n";
    content += "Business Idea: " + sanitize(businessIdea) + "\n";
    content += "Category: " + sanitize(category || "Not specified") + "\n";
    content += "Date: " + reportDate + "\n\n";

    // Recommended Location Section
    content += "RECOMMENDED LOCATION\n";
    content += "--------------------\n\n";
    content += "Best Cluster: " + sanitize(bestCluster?.friendlyName || "Cluster " + (bestCluster?.clusterId || 1)) + "\n\n";
    content += "Why This Location:\n";
    content += sanitize(bestCluster?.reason || "This area shows strong potential for your business based on clustering analysis.") + "\n\n";
    content += "Confidence Level: " + confValue + "% - " + confLabel + " (" + colorName + ")\n\n";

    const lat = recommendedLocation?.latitude?.toFixed(6) || "N/A";
    const lng = recommendedLocation?.longitude?.toFixed(6) || "N/A";
    content += "Coordinates: " + lat + ", " + lng + "\n\n";
    content += "This location was selected because it offers a good balance of opportunity and accessibility for your type of business.\n\n";

    // Map Section Placeholder
    content += "MAP VISUALIZATION\n";
    content += "-----------------\n\n";
    content += "[Map Snapshot Will Be Placed Here]\n\n";
    content += "The recommended spot is marked on the map at coordinates:\n";
    content += "Latitude: " + lat + "\n";
    content += "Longitude: " + lng + "\n\n";
    content += "The marker indicates the optimal placement within " + sanitize(bestCluster?.friendlyName || "the recommended cluster") + ".\n\n";

    // Top 3 Business Recommendations
    content += "TOP 3 BUSINESS RECOMMENDATIONS\n";
    content += "------------------------------\n\n";

    (topBusinesses || []).forEach((biz, index) => {
        content += (index + 1) + ". " + sanitize(biz.name) + "\n";
        content += "   Score: " + biz.score + "/100 | Fit: " + biz.fitPercentage + "% | Opportunity: " + biz.opportunityLevel + "\n\n";
        content += "   " + sanitize(biz.shortDescription) + "\n\n";
        content += "   Full Details:\n";
        content += "   " + sanitize(biz.fullDetails) + "\n\n";
        content += "   Preferred Location: " + sanitize(biz.preferredLocation || "Near main road for visibility") + "\n";
        content += "   Startup Budget: " + sanitize(biz.startupBudget || "PHP 50,000 - PHP 150,000") + "\n";
        content += "   Competitor Presence: " + sanitize(biz.competitorPresence || "Low competition in area") + "\n";
        content += "   Business Density: " + sanitize(biz.businessDensityInsight || "Moderate activity area") + "\n\n";
    });

    // Cluster Summary
    content += "CLUSTER SUMMARY\n";
    content += "---------------\n\n";

    (clusterSummary || []).forEach((cluster) => {
        const name = sanitize(cluster.friendlyName || "Cluster " + cluster.clusterId);
        content += "- " + name + ": " + cluster.businessCount + " businesses (" + cluster.competitionLevel + " competition)\n";
    });

    // Final Suggestion
    content += "\nFINAL SUGGESTION\n";
    content += "----------------\n\n";
    content += sanitize(finalSuggestion || "Based on our analysis, this location shows good potential for your business. Consider starting with a soft launch to test the market.") + "\n\n";
    content += "---\n";
    content += "Generated by Strategic Store Placement System\n";

    return content;
}

function generateExcelContent(data) {
    const {
        userName,
        businessIdea,
        bestCluster,
        recommendedLocation,
        clusterSummary,
        topBusinesses,
        confidence,
        confidenceLabel,
        finalSuggestion,
    } = data;

    // Summary Sheet
    const summary = [{
        "User Name": userName,
        "Business Idea": businessIdea,
        "Best Cluster": bestCluster?.clusterId || 1,
        "Friendly Name": bestCluster?.friendlyName || "Recommended Area",
        "Latitude": recommendedLocation?.latitude?.toFixed(6) || "N/A",
        "Longitude": recommendedLocation?.longitude?.toFixed(6) || "N/A",
        "Confidence %": confidence || 80,
        "Confidence Label": confidenceLabel || "Good Choice",
        "Final Suggestion": finalSuggestion || "Good potential for your business.",
    }];

    // Top Businesses Sheet
    const topBusinessesSheet = (topBusinesses || []).map((biz, index) => ({
        "Rank": index + 1,
        "Business Name": biz.name,
        "Score": biz.score,
        "Fit Percentage": biz.fitPercentage,
        "Opportunity Level": biz.opportunityLevel,
        "Short Description": biz.shortDescription,
        "Full Details": biz.fullDetails,
        "Preferred Location": biz.preferredLocation || "Near main road",
        "Startup Budget": biz.startupBudget || "₱50,000–₱150,000",
        "Competitor Presence": biz.competitorPresence || "Low",
        "Business Density Insight": biz.businessDensityInsight || "Moderate",
    }));

    // Cluster Summary Sheet
    const clusterSummarySheet = (clusterSummary || []).map((cluster) => ({
        "Cluster ID": cluster.clusterId,
        "Friendly Name": cluster.friendlyName || `Cluster ${cluster.clusterId}`,
        "Business Count": cluster.businessCount,
        "Competition Level": cluster.competitionLevel,
    }));

    return {
        summary,
        topBusinesses: topBusinessesSheet,
        clusterSummary: clusterSummarySheet,
    };
}
