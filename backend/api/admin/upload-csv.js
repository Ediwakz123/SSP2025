import { supabase } from "../../lib/supabaseClient.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { verifyAdmin } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// OFFICIAL GENERAL CATEGORIES - Single Source of Truth
// ============================================================================
const OFFICIAL_CATEGORIES = [
    "Retail",
    "Entertainment / Leisure",
    "Merchandising / Trading",
    "Food and Beverages",
    "Restaurant",
    "Misc"  // Only used if no match or explicitly selected
];

// ============================================================================
// CATEGORY NORMALIZATION MAPPING
// Maps any input category (case-insensitive) to official categories
// ============================================================================
const CATEGORY_MAPPING = {
    // ---- RETAIL ----
    // Keywords: retail, shop, store, trading, boutique, apparel, clothing, shoe, mall, hardware, convenience
    "retail": "Retail",
    "retail store": "Retail",
    "retailer": "Retail",
    "retail shop": "Retail",
    "shop": "Retail",
    "store": "Retail",
    "boutique": "Retail",
    "apparel": "Retail",
    "clothing": "Retail",
    "clothing store": "Retail",
    "shoe": "Retail",
    "shoe store": "Retail",
    "shoes": "Retail",
    "footwear": "Retail",
    "mall": "Retail",
    "convenience": "Retail",
    "convenience store": "Retail",
    "grocery": "Retail",
    "grocery store": "Retail",
    "supermarket": "Retail",
    "mini mart": "Retail",
    "minimart": "Retail",
    "sari-sari": "Retail",
    "sari-sari store": "Retail",
    "sari sari": "Retail",
    "variety store": "Retail",
    "department store": "Retail",
    "loading station": "Retail",
    "gas station": "Retail",
    "fuel station": "Retail",
    "pharmacy": "Retail",
    "drugstore": "Retail",
    "drug store": "Retail",
    "optical": "Retail",
    "optical shop": "Retail",
    "eyewear": "Retail",
    "jewelry": "Retail",
    "jewelry store": "Retail",
    "watch store": "Retail",
    "flower shop": "Retail",
    "florist": "Retail",
    "gift shop": "Retail",
    "souvenir shop": "Retail",
    "bookstore": "Retail",
    "book store": "Retail",
    "toy store": "Retail",
    "toys": "Retail",

    // ---- ENTERTAINMENT / LEISURE ----
    // Keywords: computer shop, internet cafe, gaming, entertainment, leisure, recreation, spa, salon, barbershop
    "entertainment / leisure": "Entertainment / Leisure",
    "entertainment/leisure": "Entertainment / Leisure",
    "entertainment": "Entertainment / Leisure",
    "leisure": "Entertainment / Leisure",
    "recreation": "Entertainment / Leisure",
    "computer shop": "Entertainment / Leisure",
    "computer cafe": "Entertainment / Leisure",
    "internet cafe": "Entertainment / Leisure",
    "internet shop": "Entertainment / Leisure",
    "gaming": "Entertainment / Leisure",
    "gaming center": "Entertainment / Leisure",
    "gaming cafe": "Entertainment / Leisure",
    "esports": "Entertainment / Leisure",
    "arcade": "Entertainment / Leisure",
    "game arcade": "Entertainment / Leisure",
    "video game": "Entertainment / Leisure",
    "spa": "Entertainment / Leisure",
    "salon": "Entertainment / Leisure",
    "beauty salon": "Entertainment / Leisure",
    "barbershop": "Entertainment / Leisure",
    "barber shop": "Entertainment / Leisure",
    "barber": "Entertainment / Leisure",
    "amusement": "Entertainment / Leisure",
    "billiards": "Entertainment / Leisure",
    "billiard hall": "Entertainment / Leisure",
    "bowling": "Entertainment / Leisure",
    "bowling alley": "Entertainment / Leisure",
    "cinema": "Entertainment / Leisure",
    "movie theater": "Entertainment / Leisure",
    "theater": "Entertainment / Leisure",
    "theatre": "Entertainment / Leisure",
    "concert venue": "Entertainment / Leisure",
    "events place": "Entertainment / Leisure",
    "event venue": "Entertainment / Leisure",
    "function hall": "Entertainment / Leisure",
    "resort": "Entertainment / Leisure",
    "hotel": "Entertainment / Leisure",
    "motel": "Entertainment / Leisure",
    "inn": "Entertainment / Leisure",
    "pension house": "Entertainment / Leisure",
    "lodging": "Entertainment / Leisure",
    "hostel": "Entertainment / Leisure",
    "beach resort": "Entertainment / Leisure",
    "swimming pool": "Entertainment / Leisure",
    "gym": "Entertainment / Leisure",
    "fitness center": "Entertainment / Leisure",
    "fitness gym": "Entertainment / Leisure",
    "sports complex": "Entertainment / Leisure",
    "basketball court": "Entertainment / Leisure",
    "badminton court": "Entertainment / Leisure",
    "tennis court": "Entertainment / Leisure",
    "karaoke": "Entertainment / Leisure",
    "ktv": "Entertainment / Leisure",
    "videoke": "Entertainment / Leisure",
    "nightclub": "Entertainment / Leisure",
    "night club": "Entertainment / Leisure",
    "disco": "Entertainment / Leisure",
    "club": "Entertainment / Leisure",
    "theme park": "Entertainment / Leisure",
    "amusement park": "Entertainment / Leisure",
    "playground": "Entertainment / Leisure",
    "kids playground": "Entertainment / Leisure",
    "party venue": "Entertainment / Leisure",
    "kiddie party": "Entertainment / Leisure",
    "massage": "Entertainment / Leisure",
    "services": "Entertainment / Leisure",  // Services maps to Entertainment/Leisure
    "service": "Entertainment / Leisure",

    // ---- MERCHANDISING / TRADING ----
    // Keywords: merchandise, trading, wholesale, distributor, supply, industrial goods
    "merchandising / trading": "Merchandising / Trading",
    "merchandise / trading": "Merchandising / Trading",
    "merchandise/trading": "Merchandising / Trading",
    "merchandising": "Merchandising / Trading",
    "merchandise": "Merchandising / Trading",
    "trading": "Merchandising / Trading",
    "wholesale": "Merchandising / Trading",
    "wholesaler": "Merchandising / Trading",
    "distributor": "Merchandising / Trading",
    "distribution": "Merchandising / Trading",
    "supplier": "Merchandising / Trading",
    "supply": "Merchandising / Trading",
    "industrial": "Merchandising / Trading",
    "industrial goods": "Merchandising / Trading",
    "industrial supply": "Merchandising / Trading",
    "hardware": "Merchandising / Trading",
    "hardware store": "Merchandising / Trading",
    "construction supply": "Merchandising / Trading",
    "construction supplies": "Merchandising / Trading",
    "building materials": "Merchandising / Trading",
    "electrical supply": "Merchandising / Trading",
    "electronics": "Merchandising / Trading",
    "electronics store": "Merchandising / Trading",
    "appliance": "Merchandising / Trading",
    "appliance store": "Merchandising / Trading",
    "furniture": "Merchandising / Trading",
    "furniture store": "Merchandising / Trading",
    "home depot": "Merchandising / Trading",
    "office supplies": "Merchandising / Trading",
    "school supplies": "Merchandising / Trading",
    "auto parts": "Merchandising / Trading",
    "auto supply": "Merchandising / Trading",
    "agricultural supply": "Merchandising / Trading",
    "agri supply": "Merchandising / Trading",
    "farm supply": "Merchandising / Trading",
    "textile": "Merchandising / Trading",
    "fabric": "Merchandising / Trading",
    "cellphone": "Merchandising / Trading",
    "cellphone store": "Merchandising / Trading",
    "mobile phone": "Merchandising / Trading",
    "gadget store": "Merchandising / Trading",
    "computer store": "Merchandising / Trading",
    "plant shop": "Merchandising / Trading",
    "garden center": "Merchandising / Trading",
    "sporting goods": "Merchandising / Trading",
    "sports shop": "Merchandising / Trading",

    // ---- FOOD AND BEVERAGES ----
    // Keywords: food, beverages, drinks, snacks, milk tea, coffee, cafe, bakery, fastfood
    "food and beverages": "Food and Beverages",
    "food & beverages": "Food and Beverages",
    "food&beverages": "Food and Beverages",
    "food and beverage": "Food and Beverages",
    "food & beverage": "Food and Beverages",
    "f&b": "Food and Beverages",
    "fnb": "Food and Beverages",
    "food": "Food and Beverages",
    "beverages": "Food and Beverages",
    "beverage": "Food and Beverages",
    "drinks": "Food and Beverages",
    "snacks": "Food and Beverages",
    "snack": "Food and Beverages",
    "milk tea": "Food and Beverages",
    "milktea": "Food and Beverages",
    "bubble tea": "Food and Beverages",
    "boba": "Food and Beverages",
    "coffee": "Food and Beverages",
    "coffee shop": "Food and Beverages",
    "coffeeshop": "Food and Beverages",
    "coffee house": "Food and Beverages",
    "cafe": "Food and Beverages",
    "bakery": "Food and Beverages",
    "bakeshop": "Food and Beverages",
    "bake shop": "Food and Beverages",
    "pastry": "Food and Beverages",
    "pastry shop": "Food and Beverages",
    "tea shop": "Food and Beverages",
    "juice bar": "Food and Beverages",
    "smoothie": "Food and Beverages",
    "bar": "Food and Beverages",
    "pub": "Food and Beverages",
    "wine bar": "Food and Beverages",
    "beer house": "Food and Beverages",
    "snack bar": "Food and Beverages",
    "dessert": "Food and Beverages",
    "dessert shop": "Food and Beverages",
    "ice cream": "Food and Beverages",
    "ice cream shop": "Food and Beverages",
    "confectionery": "Food and Beverages",
    "candy shop": "Food and Beverages",
    "water refilling": "Food and Beverages",
    "water station": "Food and Beverages",
    "food manufacturing": "Food and Beverages",
    "food processing": "Food and Beverages",
    "catering": "Food and Beverages",
    "fastfood": "Food and Beverages",
    "fast food": "Food and Beverages",

    // ---- RESTAURANT ----
    // Keywords: restaurant, diner, grill, resto, eatery, bistro
    "restaurant": "Restaurant",
    "restaurants": "Restaurant",
    "resto": "Restaurant",
    "diner": "Restaurant",
    "eatery": "Restaurant",
    "bistro": "Restaurant",
    "dining": "Restaurant",
    "fine dining": "Restaurant",
    "cafeteria": "Restaurant",
    "canteen": "Restaurant",
    "food court": "Restaurant",
    "buffet": "Restaurant",
    "grill": "Restaurant",
    "ihaw": "Restaurant",
    "ihawan": "Restaurant",
    "carinderia": "Restaurant",
    "turo-turo": "Restaurant",
    "turo turo": "Restaurant",
    "food stall": "Restaurant",
    "food stand": "Restaurant",
    "pizza": "Restaurant",
    "pizza parlor": "Restaurant",
    "burger": "Restaurant",
    "burger joint": "Restaurant",
    "chicken": "Restaurant",
    "fried chicken": "Restaurant",
    "bbq": "Restaurant",
    "barbecue": "Restaurant",
    "seafood": "Restaurant",
    "seafood restaurant": "Restaurant",
    "noodle house": "Restaurant",
    "ramen": "Restaurant",
    "sushi": "Restaurant",
    "japanese restaurant": "Restaurant",
    "chinese restaurant": "Restaurant",
    "korean restaurant": "Restaurant",
    "italian restaurant": "Restaurant",
    "mexican restaurant": "Restaurant",

    // ---- MISC ----
    // Only used if no keywords match or explicitly selected
    "misc": "Misc",
    "miscellaneous": "Misc",
    "other": "Misc",
    "others": "Misc",
    "unknown": "Misc",
};

// Keywords for fuzzy matching fallback
const CATEGORY_KEYWORDS = {
    "Retail": ["retail", "shop", "store", "boutique", "apparel", "clothing", "shoe", "mall", "convenience"],
    "Entertainment / Leisure": ["computer shop", "internet cafe", "gaming", "entertainment", "leisure", "recreation", "spa", "salon", "barbershop", "barber"],
    "Merchandising / Trading": ["merchandise", "trading", "wholesale", "distributor", "supply", "industrial", "hardware"],
    "Food and Beverages": ["food", "beverages", "drinks", "snacks", "milk tea", "milktea", "coffee", "cafe", "bakery", "fastfood"],
    "Restaurant": ["restaurant", "diner", "grill", "resto", "eatery", "bistro"],
};

/**
 * Normalizes a category string to an official category
 * @param {string} inputCategory - The input category from CSV
 * @returns {string} - The normalized official category
 */
function normalizeCategory(inputCategory) {
    if (!inputCategory || typeof inputCategory !== 'string') {
        return "Misc"; // Default fallback when no input
    }

    const normalized = inputCategory.trim().toLowerCase();

    // Direct mapping lookup
    if (CATEGORY_MAPPING[normalized]) {
        return CATEGORY_MAPPING[normalized];
    }

    // Check if already an official category (case-insensitive)
    const officialMatch = OFFICIAL_CATEGORIES.find(
        cat => cat.toLowerCase() === normalized
    );
    if (officialMatch) {
        return officialMatch;
    }

    // Fuzzy matching - check if input contains any mapped key
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    // Keyword-based matching
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                return category;
            }
        }
    }

    // Return "Misc" as ultimate fallback when no match
    console.warn(`Unknown category "${inputCategory}" - defaulting to Misc`);
    return "Misc";
}

// Helper to parse CSV line respecting quotes
function parseCSVLine(text) {
    const result = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === "," && !inQuote) {
            result.push(cur.trim());
            cur = "";
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

export default async function handler(req, res) {
    // Verify admin authentication
    const admin = verifyAdmin(req, res);
    if (!admin) return;

    if (req.method !== "POST") {
        return res.status(405).json({
            status: "error",
            message: "Method not allowed",
        });
    }

    try {
        const { csvData } = req.body;

        if (!csvData) {
            return res.status(400).json({
                status: "error",
                message: "No CSV data provided",
            });
        }

        const lines = csvData.split(/\r?\n/).filter((line) => line.trim() !== "");
        if (lines.length < 2) {
            return res.status(400).json({
                status: "error",
                message: "CSV must contain a header and at least one row",
            });
        }

        // 1. Validate Headers
        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
        const requiredColumns = [
            "business_id",
            "business_name",
            "general_category",
            "latitude",
            "longitude",
            "street",
            "zone_type",
            "status",
        ];

        const missingColumns = requiredColumns.filter(
            (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
            return res.status(400).json({
                action: "none",
                validated_rows: [],
                missing_columns: missingColumns,
                ml_trigger: false,
                status: "error",
                message: `Missing required columns: ${missingColumns.join(", ")}`,
            });
        }

        // 2. Parse and Validate Rows
        const validatedRows = [];
        const errors = [];
        const normalizedCategories = []; // Track category normalizations

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                errors.push(`Row ${i + 1}: Column count mismatch`);
                continue;
            }

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            // Basic Type Validation
            if (isNaN(parseInt(row.business_id))) {
                errors.push(`Row ${i + 1}: Invalid business_id`);
                continue;
            }
            if (isNaN(parseFloat(row.latitude)) || isNaN(parseFloat(row.longitude))) {
                errors.push(`Row ${i + 1}: Invalid coordinates`);
                continue;
            }

            // Clean up types
            row.business_id = parseInt(row.business_id);
            row.latitude = parseFloat(row.latitude);
            row.longitude = parseFloat(row.longitude);

            // ✅ NORMALIZE CATEGORY - Auto-map any category to official categories
            if (row.general_category) {
                const originalCategory = row.general_category;
                row.general_category = normalizeCategory(row.general_category);
                if (originalCategory.toLowerCase() !== row.general_category.toLowerCase()) {
                    console.log(`Category normalized: "${originalCategory}" → "${row.general_category}"`);
                    normalizedCategories.push({
                        row: i + 1,
                        original: originalCategory,
                        normalized: row.general_category
                    });
                }
            }

            validatedRows.push(row);
        }

        if (validatedRows.length === 0) {
            return res.status(400).json({
                action: "none",
                validated_rows: [],
                missing_columns: [],
                ml_trigger: false,
                status: "error",
                message: "No valid rows found to process. " + errors.join("; "),
            });
        }

        // 3. Clear existing data and insert new (same strategy as frontend)
        // First, delete all existing businesses
        const { error: deleteError } = await supabase
            .from("businesses")
            .delete()
            .neq("id", 0); // Delete all rows

        if (deleteError) {
            console.error("Delete error:", deleteError);
            throw deleteError;
        }

        // Prepare rows for insertion (map to businesses table schema)
        const insertRows = validatedRows.map(row => ({
            business_id: row.business_id,
            business_name: row.business_name,
            general_category: row.general_category,
            latitude: row.latitude,
            longitude: row.longitude,
            street: row.street,
            zone_type: row.zone_type,
            status: row.status || 'active'
        }));

        // Insert all new data
        const { error: insertError } = await supabase
            .from("businesses")
            .insert(insertRows);

        if (insertError) {
            console.error("Insert error:", insertError);
            throw insertError;
        }

        // 4. Trigger ML Pipeline
        // Path to train.py: ../../ml/train.py relative to this file
        const trainScriptPath = path.resolve(__dirname, "../../ml/train.py");

        console.log("Triggering ML script at:", trainScriptPath);

        const pythonProcess = spawn("python", [trainScriptPath]);

        pythonProcess.stdout.on("data", (data) => {
            console.log(`ML Output: ${data}`);
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`ML Error: ${data}`);
        });

        pythonProcess.on("close", (code) => {
            console.log(`ML process exited with code ${code}`);
        });

        // Return success immediately, ML runs in background
        return res.status(200).json({
            action: "upsert", // Simplified to upsert as we are doing both insert/update
            validated_rows: validatedRows.length,
            missing_columns: [],
            ml_trigger: true,
            normalized_categories: normalizedCategories.length,
            category_mappings: normalizedCategories.length > 0 ? normalizedCategories.slice(0, 10) : [], // Show first 10
            status: "success",
            message: `Successfully processed ${validatedRows.length} rows${normalizedCategories.length > 0 ? ` (${normalizedCategories.length} categories auto-normalized)` : ''} and triggered ML pipeline.`,
        });

    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({
            action: "none",
            validated_rows: [],
            missing_columns: [],
            ml_trigger: false,
            status: "error",
            message: error.message,
        });
    }
}
