import { supabase } from "../../lib/supabaseClient.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

        // 3. Upsert to Supabase
        const { error: upsertError } = await supabase
            .from("business_raw")
            .upsert(validatedRows, { onConflict: "business_id" });

        if (upsertError) {
            throw upsertError;
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
            status: "success",
            message: `Successfully processed ${validatedRows.length} rows and triggered ML pipeline.`,
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
