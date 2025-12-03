import handler from "./api/admin/upload-csv.js";

// Mock Request
const req = {
    method: "POST",
    body: {
        csvData: `business_id,business_name,general_category,latitude,longitude,street,zone_type,status
101,"Test Business 1","Retail",14.5,121.0,"Test Street 1","Commercial","Active"
102,"Test Business 2","Service",14.6,121.1,"Test Street 2","Residential","Active"
103,"Test Business 3","Retail",14.7,121.2,"Test Street 3","Commercial","Active"`
    }
};

// Mock Response
const res = {
    status: (code) => {
        console.log(`Response Status: ${code}`);
        return res;
    },
    json: (data) => {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
        return res;
    }
};

console.log("Running test...");
handler(req, res).then(() => {
    console.log("Test finished.");
}).catch(err => {
    console.error("Test failed:", err);
});
