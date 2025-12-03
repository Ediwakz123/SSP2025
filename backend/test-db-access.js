import { supabase } from "./lib/supabaseClient.js";

async function testDatabase() {
    console.log("Testing database access...\n");

    // Test 1: Read from business_raw
    console.log("1. Testing READ from business_raw...");
    const { data: readData, error: readError } = await supabase
        .from("business_raw")
        .select("*")
        .limit(1);

    if (readError) {
        console.error("❌ Read failed:", readError.message);
    } else {
        console.log("✓ Read successful. Rows:", readData?.length || 0);
    }

    // Test 2: Try to INSERT
    console.log("\n2. Testing INSERT to business_raw...");
    const testRow = {
        business_id: 999999,
        business_name: "Test Business",
        general_category: "Retail",
        latitude: 14.5995,
        longitude: 120.9842,
        street: "Test St",
        zone_type: "Commercial",
        status: "active"
    };

    const { data: insertData, error: insertError } = await supabase
        .from("business_raw")
        .insert(testRow)
        .select();

    if (insertError) {
        console.error("❌ Insert failed:", insertError.message);
        console.error("Code:", insertError.code);
        console.error("\n⚠️  RLS POLICY NOT WORKING - Run the SQL again!");
    } else {
        console.log("✓ Insert successful!");

        // Clean up
        await supabase.from("business_raw").delete().eq("business_id", 999999);
        console.log("✓ Test data cleaned up");
    }
}

testDatabase();
