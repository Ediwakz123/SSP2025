// api/users/[id].js
const { supabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  const { id } = req.query; // /api/users/123

  if (!id) return res.status(400).json({ error: 'User ID required' });

  try {
    /* -----------------------------------------------------
     * GET USER BY ID
     * --------------------------------------------------- */
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json({ user: data });
    }

    /* -----------------------------------------------------
     * UPDATE USER
     * --------------------------------------------------- */
    if (req.method === 'PUT') {
      const updateData = req.body;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Update Error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      return res.status(200).json({ message: 'User updated', user: data });
    }

    /* -----------------------------------------------------
     * DELETE USER
     * --------------------------------------------------- */
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete Error:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      return res.status(200).json({ message: 'User deleted' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Users API Error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
};
