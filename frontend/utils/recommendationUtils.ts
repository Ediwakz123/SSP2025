/**
 * Recommendation Utilities for "Recommended for You" Section
 * 
 * Generates personalized, non-technical recommendations based on
 * clustering results, competition levels, zone types, and user preferences.
 */

// ============================================================================
// Types
// ============================================================================

export interface RecommendationData {
    businessType: string;
    competitionLevel: "Low" | "Medium" | "High";
    zoneType: string;
    activityTime: "Day" | "Evening" | "Both";
    avgDensity: number;
    avgCompetitors: number;
    clusterCount: number;
}

export interface WhyRecommendedResult {
    summary: string;
    points: string[];
}

export interface OperatingHoursResult {
    recommended: "Day" | "Evening" | "Both";
    reason: string;
}

export interface BusinessSizeResult {
    recommended: "Small" | "Medium" | "Large";
    reason: string;
}

export interface RiskSummaryResult {
    level: "Low" | "Medium" | "High";
    reason: string;
}

export interface EntryStrategyResult {
    strategy: "First-mover advantage" | "Gradual entry" | "Competitive positioning";
    reason: string;
}

// ============================================================================
// 1. Why This Is Recommended for You
// ============================================================================

export function generateWhyRecommended(data: RecommendationData): WhyRecommendedResult {
    const points: string[] = [];

    // Business match
    if (data.businessType) {
        points.push(`Matches your interest in ${data.businessType.toLowerCase()} businesses`);
    }

    // Competition assessment
    if (data.competitionLevel === "Low") {
        points.push("Few competitors in the area means easier market entry");
    } else if (data.competitionLevel === "Medium") {
        points.push("Manageable competition with room to stand out");
    } else {
        points.push("Established market with proven customer demand");
    }

    // Zone type insight
    const zone = data.zoneType?.toLowerCase() || "mixed";
    if (zone.includes("commercial")) {
        points.push("Commercial zone offers high visibility and foot traffic");
    } else if (zone.includes("residential")) {
        points.push("Residential area provides a loyal community customer base");
    } else {
        points.push("Mixed zone balances residential convenience with business activity");
    }

    // Activity time match
    if (data.activityTime === "Both") {
        points.push("Area is active throughout the day for flexible hours");
    } else if (data.activityTime === "Day") {
        points.push("Strong daytime activity fits standard business hours");
    } else {
        points.push("Evening activity is high, ideal for after-work customers");
    }

    // Generate summary
    const competitionText = data.competitionLevel === "Low" ? "low competition" :
        data.competitionLevel === "Medium" ? "manageable competition" : "established demand";
    const summary = `This opportunity is recommended because it matches your business type, has ${competitionText}, and performs well during your preferred operating hours.`;

    return { summary, points };
}

// ============================================================================
// 2. Operating Hours Recommendation
// ============================================================================

export function generateOperatingHoursRecommendation(data: RecommendationData): OperatingHoursResult {
    const zone = data.zoneType?.toLowerCase() || "mixed";
    const businessType = data.businessType?.toLowerCase() || "";

    // Food/restaurant businesses often benefit from evening hours
    if (businessType.includes("restaurant") || businessType.includes("food")) {
        if (data.activityTime === "Evening" || zone.includes("commercial")) {
            return {
                recommended: "Both",
                reason: "Food businesses thrive with extended hours. Lunch and dinner service will maximize customer reach in this active area."
            };
        }
        return {
            recommended: "Both",
            reason: "Nearby businesses support both daytime and evening customers. Consider operating from morning through dinner hours."
        };
    }

    // Retail/services in residential areas
    if (zone.includes("residential")) {
        return {
            recommended: "Day",
            reason: "Residential areas see most activity during morning to afternoon hours when residents are running errands."
        };
    }

    // Commercial zones with evening markets
    if (zone.includes("commercial") && data.activityTime === "Evening") {
        return {
            recommended: "Evening",
            reason: "This commercial area peaks during evening hours. Focus on after-work customers for best results."
        };
    }

    // Default for mixed or balanced zones
    if (data.activityTime === "Both" || zone.includes("mixed")) {
        return {
            recommended: "Both",
            reason: "This area supports activity throughout the day. Flexible operating hours will capture the widest customer base."
        };
    }

    return {
        recommended: data.activityTime,
        reason: `The area shows strong ${data.activityTime.toLowerCase()} activity based on nearby business patterns.`
    };
}

// ============================================================================
// 3. Business Size Recommendation
// ============================================================================

export function generateBusinessSizeRecommendation(data: RecommendationData): BusinessSizeResult {
    const zone = data.zoneType?.toLowerCase() || "mixed";

    // High competition + high density = need to be competitive (medium to large)
    if (data.competitionLevel === "High" && data.avgDensity >= 10) {
        return {
            recommended: "Medium",
            reason: "A medium setup helps you compete in this busy area while managing costs. Focus on quality over size."
        };
    }

    // Low competition + commercial zone = opportunity for larger setup
    if (data.competitionLevel === "Low" && zone.includes("commercial")) {
        return {
            recommended: "Medium",
            reason: "Low competition in a commercial zone allows room to grow. Start medium-sized to capture the available market."
        };
    }

    // Low competition + residential = start small, grow with community
    if (data.competitionLevel === "Low" && zone.includes("residential")) {
        return {
            recommended: "Small",
            reason: "A small setup works well in residential areas. Build community trust first, then expand based on demand."
        };
    }

    // High density clusters = more investment opportunity
    if (data.clusterCount >= 5 && data.avgDensity >= 15) {
        return {
            recommended: "Large",
            reason: "Multiple high-activity clusters indicate strong market potential. A larger setup can serve more customers."
        };
    }

    // Medium competition = balanced approach
    if (data.competitionLevel === "Medium") {
        return {
            recommended: "Small",
            reason: "A small to medium setup is recommended due to moderate competition and a commercial zone environment."
        };
    }

    // Default conservative recommendation
    return {
        recommended: "Small",
        reason: "Starting small allows you to test the market and expand based on actual customer response."
    };
}

// ============================================================================
// 4. Risk Summary
// ============================================================================

export function generateRiskSummary(data: RecommendationData): RiskSummaryResult {
    // Low risk conditions
    if (data.competitionLevel === "Low" && data.avgDensity >= 5) {
        return {
            level: "Low",
            reason: "Demand is consistent and competition is limited."
        };
    }

    // High risk conditions
    if (data.competitionLevel === "High" && data.avgCompetitors >= 8) {
        return {
            level: "High",
            reason: "Crowded market requires strong differentiation strategy."
        };
    }

    // Low density areas carry risk
    if (data.avgDensity < 3) {
        return {
            level: "Medium",
            reason: "Lower business presence may mean developing customer base takes time."
        };
    }

    // High density with moderate competition is moderate risk
    if (data.avgDensity >= 10 && data.competitionLevel === "Medium") {
        return {
            level: "Low",
            reason: "Active area with balanced competition supports steady business."
        };
    }

    // Commercial zones generally lower risk
    const zone = data.zoneType?.toLowerCase() || "";
    if (zone.includes("commercial") && data.competitionLevel !== "High") {
        return {
            level: "Low",
            reason: "Commercial zones provide reliable customer traffic year-round."
        };
    }

    // Default moderate risk
    return {
        level: "Medium",
        reason: "Standard market conditions require good planning and execution."
    };
}

// ============================================================================
// 5. Entry Strategy
// ============================================================================

export function generateEntryStrategy(data: RecommendationData): EntryStrategyResult {
    // First-mover advantage: Low competition + decent density
    if (data.competitionLevel === "Low" && data.avgDensity >= 5) {
        return {
            strategy: "First-mover advantage",
            reason: "Few competitors in an active area. Enter quickly to establish brand recognition before others arrive."
        };
    }

    // First-mover for underserved categories
    if (data.competitionLevel === "Low" && data.avgCompetitors <= 1) {
        return {
            strategy: "First-mover advantage",
            reason: "Minimal existing presence means you can define the market. Move fast and build customer loyalty early."
        };
    }

    // Competitive positioning: High competition needs differentiation
    if (data.competitionLevel === "High") {
        return {
            strategy: "Competitive positioning",
            reason: "Focus on what makes you different. Highlight unique products, better service, or competitive pricing."
        };
    }

    // Gradual entry: Medium competition or uncertain markets
    if (data.competitionLevel === "Medium" || data.avgDensity < 5) {
        return {
            strategy: "Gradual entry",
            reason: "Test the market with limited investment first. Expand as you learn what works in this area."
        };
    }

    // Default gradual entry for safety
    return {
        strategy: "Gradual entry",
        reason: "Start with a focused offering and grow based on customer feedback and demand."
    };
}

// ============================================================================
// Combined Recommendation Generator
// ============================================================================

export interface FullRecommendation {
    whyRecommended: WhyRecommendedResult;
    operatingHours: OperatingHoursResult;
    businessSize: BusinessSizeResult;
    riskSummary: RiskSummaryResult;
    entryStrategy: EntryStrategyResult;
}

export function generateFullRecommendation(data: RecommendationData): FullRecommendation {
    return {
        whyRecommended: generateWhyRecommended(data),
        operatingHours: generateOperatingHoursRecommendation(data),
        businessSize: generateBusinessSizeRecommendation(data),
        riskSummary: generateRiskSummary(data),
        entryStrategy: generateEntryStrategy(data),
    };
}
