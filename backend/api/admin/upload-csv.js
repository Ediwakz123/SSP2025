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
    "Services", 
    "Restaurant",
    "Food & Beverages",
    "Merchandise / Trading",
    "Entertainment / Leisure",
    "Pet Store"
];

// ============================================================================
// CATEGORY NORMALIZATION MAPPING
// Maps any input category (case-insensitive) to official categories
// ============================================================================
const CATEGORY_MAPPING = {
    // ---- RETAIL ----
    "retail": "Retail",
    "retail store": "Retail",
    "retailer": "Retail",
    "retail shop": "Retail",
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
    "general merchandise": "Retail",
    "department store": "Retail",
    "loading station": "Retail",
    "gas station": "Retail",
    "fuel station": "Retail",
    "pharmacy": "Retail",
    "drugstore": "Retail",
    "drug store": "Retail",
    "bakery": "Retail",
    "bakeshop": "Retail",
    "bake shop": "Retail",

    // ---- SERVICES ----
    "services": "Services",
    "service": "Services",
    "service provider": "Services",
    "salon": "Services",
    "barbershop": "Services",
    "barber shop": "Services",
    "beauty salon": "Services",
    "spa": "Services",
    "massage": "Services",
    "laundry": "Services",
    "laundry shop": "Services",
    "laundromat": "Services",
    "dry cleaning": "Services",
    "repair shop": "Services",
    "repair": "Services",
    "mechanic": "Services",
    "auto repair": "Services",
    "car wash": "Services",
    "carwash": "Services",
    "printing": "Services",
    "printing shop": "Services",
    "print shop": "Services",
    "photo studio": "Services",
    "photography": "Services",
    "clinic": "Services",
    "medical clinic": "Services",
    "dental clinic": "Services",
    "dentist": "Services",
    "health services": "Services",
    "tutorial": "Services",
    "tutorial center": "Services",
    "training center": "Services",
    "internet cafe": "Services",
    "computer shop": "Services",
    "pawnshop": "Services",
    "pawn shop": "Services",
    "remittance": "Services",
    "money transfer": "Services",
    "travel agency": "Services",
    "real estate": "Services",
    "insurance": "Services",
    "consultancy": "Services",
    "consulting": "Services",
    "legal services": "Services",
    "accounting": "Services",
    "funeral": "Services",
    "funeral services": "Services",
    "pet grooming": "Services",
    "veterinary": "Services",
    "vet clinic": "Services",

    // ---- RESTAURANT ----
    "restaurant": "Restaurant",
    "restaurants": "Restaurant",
    "resto": "Restaurant",
    "diner": "Restaurant",
    "eatery": "Restaurant",
    "dining": "Restaurant",
    "fine dining": "Restaurant",
    "fast food": "Restaurant",
    "fastfood": "Restaurant",
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

    // ---- FOOD & BEVERAGES ----
    "food & beverages": "Food & Beverages",
    "food and beverages": "Food & Beverages",
    "food&beverages": "Food & Beverages",
    "food & beverage": "Food & Beverages",
    "food and beverage": "Food & Beverages",
    "f&b": "Food & Beverages",
    "fnb": "Food & Beverages",
    "cafe": "Food & Beverages",
    "coffee shop": "Food & Beverages",
    "coffeeshop": "Food & Beverages",
    "coffee house": "Food & Beverages",
    "tea shop": "Food & Beverages",
    "milk tea": "Food & Beverages",
    "milktea": "Food & Beverages",
    "bubble tea": "Food & Beverages",
    "boba": "Food & Beverages",
    "juice bar": "Food & Beverages",
    "smoothie": "Food & Beverages",
    "beverage": "Food & Beverages",
    "beverages": "Food & Beverages",
    "drinks": "Food & Beverages",
    "bar": "Food & Beverages",
    "pub": "Food & Beverages",
    "wine bar": "Food & Beverages",
    "beer house": "Food & Beverages",
    "snack bar": "Food & Beverages",
    "snacks": "Food & Beverages",
    "dessert": "Food & Beverages",
    "dessert shop": "Food & Beverages",
    "ice cream": "Food & Beverages",
    "ice cream shop": "Food & Beverages",
    "pastry": "Food & Beverages",
    "pastry shop": "Food & Beverages",
    "confectionery": "Food & Beverages",
    "candy shop": "Food & Beverages",
    "water refilling": "Food & Beverages",
    "water station": "Food & Beverages",
    "food manufacturing": "Food & Beverages",
    "food processing": "Food & Beverages",
    "catering": "Food & Beverages",

    // ---- MERCHANDISE / TRADING ----
    "merchandise / trading": "Merchandise / Trading",
    "merchandise/trading": "Merchandise / Trading",
    "merchandise": "Merchandise / Trading",
    "trading": "Merchandise / Trading",
    "wholesale": "Merchandise / Trading",
    "wholesaler": "Merchandise / Trading",
    "distributor": "Merchandise / Trading",
    "distribution": "Merchandise / Trading",
    "supplier": "Merchandise / Trading",
    "supply": "Merchandise / Trading",
    "hardware": "Merchandise / Trading",
    "hardware store": "Merchandise / Trading",
    "construction supply": "Merchandise / Trading",
    "construction supplies": "Merchandise / Trading",
    "building materials": "Merchandise / Trading",
    "electrical supply": "Merchandise / Trading",
    "electronics": "Merchandise / Trading",
    "electronics store": "Merchandise / Trading",
    "appliance": "Merchandise / Trading",
    "appliance store": "Merchandise / Trading",
    "furniture": "Merchandise / Trading",
    "furniture store": "Merchandise / Trading",
    "home depot": "Merchandise / Trading",
    "industrial supply": "Merchandise / Trading",
    "office supplies": "Merchandise / Trading",
    "school supplies": "Merchandise / Trading",
    "auto parts": "Merchandise / Trading",
    "auto supply": "Merchandise / Trading",
    "agricultural supply": "Merchandise / Trading",
    "agri supply": "Merchandise / Trading",
    "farm supply": "Merchandise / Trading",
    "textile": "Merchandise / Trading",
    "fabric": "Merchandise / Trading",
    "clothing": "Merchandise / Trading",
    "apparel": "Merchandise / Trading",
    "shoes": "Merchandise / Trading",
    "footwear": "Merchandise / Trading",
    "jewelry": "Merchandise / Trading",
    "jewelry store": "Merchandise / Trading",
    "watch store": "Merchandise / Trading",
    "cellphone": "Merchandise / Trading",
    "cellphone store": "Merchandise / Trading",
    "mobile phone": "Merchandise / Trading",
    "gadget store": "Merchandise / Trading",
    "computer store": "Merchandise / Trading",
    "bookstore": "Merchandise / Trading",
    "book store": "Merchandise / Trading",
    "toy store": "Merchandise / Trading",
    "toys": "Merchandise / Trading",
    "gift shop": "Merchandise / Trading",
    "souvenir shop": "Merchandise / Trading",
    "flower shop": "Merchandise / Trading",
    "florist": "Merchandise / Trading",
    "plant shop": "Merchandise / Trading",
    "garden center": "Merchandise / Trading",
    "sporting goods": "Merchandise / Trading",
    "sports shop": "Merchandise / Trading",
    "optical": "Merchandise / Trading",
    "optical shop": "Merchandise / Trading",
    "eyewear": "Merchandise / Trading",

    // ---- ENTERTAINMENT / LEISURE ----
    "entertainment / leisure": "Entertainment / Leisure",
    "entertainment/leisure": "Entertainment / Leisure",
    "entertainment": "Entertainment / Leisure",
    "leisure": "Entertainment / Leisure",
    "recreation": "Entertainment / Leisure",
    "amusement": "Entertainment / Leisure",
    "arcade": "Entertainment / Leisure",
    "game arcade": "Entertainment / Leisure",
    "video game": "Entertainment / Leisure",
    "gaming": "Entertainment / Leisure",
    "gaming center": "Entertainment / Leisure",
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

    // ---- PET STORE ----
    "pet store": "Pet Store",
    "pet shop": "Pet Store",
    "petshop": "Pet Store",
    "pet supplies": "Pet Store",
    "pet supply": "Pet Store",
    "pet food": "Pet Store",
    "pet accessories": "Pet Store",
    "aquarium": "Pet Store",
    "aquarium shop": "Pet Store",
    "fish store": "Pet Store",
    "bird shop": "Pet Store",
    "pet center": "Pet Store",
    "animal store": "Pet Store",
};

/**
 * Normalizes a category string to an official category
 * @param {string} inputCategory - The input category from CSV
 * @returns {string} - The normalized official category or original if no match
 */
function normalizeCategory(inputCategory) {
    if (!inputCategory || typeof inputCategory !== 'string') {
        return "Retail"; // Default fallback
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

    // Fuzzy matching - check if input contains any key
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    // Default fallback based on keywords
    if (normalized.includes("food") || normalized.includes("eat") || normalized.includes("drink")) {
        return "Food & Beverages";
    }
    if (normalized.includes("store") || normalized.includes("shop") || normalized.includes("mart")) {
        return "Retail";
    }
    if (normalized.includes("service") || normalized.includes("repair") || normalized.includes("clean")) {
        return "Services";
    }

    // Return "Retail" as ultimate fallback
    console.warn(`Unknown category "${inputCategory}" - defaulting to Retail`);
    return "Retail";
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
