const { supabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  try {
    /* -----------------------------------------------------
     * GET ALL BUSINESSES
     * --------------------------------------------------- */
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error("Supabase Error:", error);
        return res.status(500).json({ error: "Failed to fetch businesses" });
      }

      return res.status(200).json({ businesses: data });
    }

    /* -----------------------------------------------------
     * CREATE NEW BUSINESS
     * --------------------------------------------------- */
    if (req.method === 'POST') {
      const newBusiness = req.body;

      // Validate required fields
      const requiredFields = [
        'business_name',
        'category',
        'latitude',
        'longitude',
        'street',
        'zone_type',
      ];

      for (const field of requiredFields) {
        if (!newBusiness[field]) {
          return res.status(400).json({
            error: `Missing required field: ${field}`,
          });
        }
      }

      const { data, error } = await supabase
        .from('businesses')
        .insert(newBusiness)
        .select('*')
        .single();

      if (error) {
        console.error("Insert Error:", error);
        return res.status(500).json({ error: "Failed to create business" });
      }

      return res.status(201).json({ message: "Business created", business: data });
    }

    /* -----------------------------------------------------
     * METHOD NOT ALLOWED
     * --------------------------------------------------- */
    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (err) {
    console.error("Businesses API Error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};
