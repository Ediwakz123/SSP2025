import { supabase } from "./lib/supabaseClient.js";

async function fixRLS() {
    console.log("Fixing RLS policies for business_raw...");

    const sqlStatements = [
        // Drop existing policies to avoid conflicts
        `DROP POLICY IF EXISTS "Enable access for authenticated users" ON public.business_raw;`,
        `DROP POLICY IF EXISTS "Service Role Full Access" ON public.business_raw;`,

        // Re-create Service Role policy
        `CREATE POLICY "Service Role Full Access" ON public.business_raw
            FOR ALL
            USING (auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'service_role');`,

        // Create policy for Authenticated Users (Frontend)
        `CREATE POLICY "Enable access for authenticated users" ON public.business_raw
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);`
    ];

    for (const sql of sqlStatements) {
        console.log(`Executing: ${sql.substring(0, 50)}...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error("Error:", error);
            console.log("\nNote: If exec_sql function doesn't exist, you'll need to run this SQL manually in Supabase Dashboard.");
            console.log("\nAlternatively, try running the SQL from backend/db/fix_rls.sql in your Supabase SQL Editor.");
            break;
        } else {
            console.log("✓ Success");
        }
    }
}

fixRLS();
