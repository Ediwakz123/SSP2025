// api/users/index.js
import { supabase } from '../../lib/supabaseClient.js';

// Helper to remove sensitive fields from user objects
const sanitizeUser = (user) => {
  const { hashed_password, ...safeUser } = user;
  return safeUser;
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      // Remove sensitive data before returning
      const safeUsers = data.map(sanitizeUser);

      return res.status(200).json({ users: safeUsers });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Users API Error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
}
