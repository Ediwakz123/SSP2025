import { supabase } from '../../lib/supabaseClient.js';
import { comparePassword } from '../../lib/bcrypt.js';
import { signToken } from '../../lib/jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

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
    const valid = await comparePassword(password, user.hashed_password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT with uid (the actual primary key)
    const token = signToken({ userId: user.uid, email: user.email });

    // Remove sensitive data before returning
    const { hashed_password, ...safeUser } = user;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
