// api/users/[id].js
import { supabase } from '../../lib/supabaseClient.js';

// Helper to remove sensitive fields from user objects
const sanitizeUser = (user) => {
  const { hashed_password, ...safeUser } = user;
  return safeUser;
};

export default async function handler(req, res) {
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
        .eq('uid', id)
        .single();

      if (error) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json({ user: sanitizeUser(data) });
    }

    /* -----------------------------------------------------
     * UPDATE USER
     * --------------------------------------------------- */
    if (req.method === 'PUT') {
      const updateData = req.body;
      
      // Prevent direct password updates through this endpoint
      delete updateData.hashed_password;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('uid', id)
        .select('*')
        .single();

      if (error) {
        console.error('Update Error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      return res.status(200).json({ message: 'User updated', user: sanitizeUser(data) });
    }

    /* -----------------------------------------------------
     * DELETE USER
     * --------------------------------------------------- */
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('uid', id);

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
}
