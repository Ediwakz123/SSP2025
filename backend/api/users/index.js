// api/users/index.js
const { supabase } = require('../../lib/supabaseClient');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      return res.status(200).json({ users: data });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Users API Error:', err);
    return res.status(500).json({ error: 'Server Error' });
  }
};
