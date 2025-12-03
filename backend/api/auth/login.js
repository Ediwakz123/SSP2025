const { supabase } = require('../../lib/supabaseClient');
const { verifyPassword } = require('../../lib/bcrypt');
const { generateToken } = require('../../lib/jwt');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const valid = await verifyPassword(password, user.hashed_password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT
    const token = generateToken({ userId: user.id });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
