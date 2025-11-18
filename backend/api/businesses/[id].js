const { supabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: "Business ID required" });

  try {
    /* -----------------------------------------------------
     * GET BUSINESS BY ID
     * --------------------------------------------------- */
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return res.status(404).json({ error: "Business not found" });

      return res.status(200).json({ business: data });
    }

    /* -----------------------------------------------------
     * UPDATE BUSINESS
     * --------------------------------------------------- */
    if (req.method === 'PUT') {
      const updates = req.body;

      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ error: "Failed to update business" });
      }

      return res.status(200).json({
        message: "Business updated",
        business: data
      });
    }

    /* -----------------------------------------------------
     * DELETE BUSINESS
     * --------------------------------------------------- */
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({ error: "Failed to delete business" });
      }

      return res.status(200).json({ message: "Business deleted" });
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
