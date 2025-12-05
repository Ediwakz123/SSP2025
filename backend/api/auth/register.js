import { supabase } from '../../lib/supabaseClient.js';
import { hashPassword } from '../../lib/bcrypt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      email,
      password,
      username,
      phone_number,
      gender,
      date_of_birth,
      first_name,
      last_name,
      address
    } = req.body;

    // Check required fields
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, username'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashed_password = await hashPassword(password);

    // Insert user (without age)
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        hashed_password,
        username,
        phone_number,
        gender,
        date_of_birth,
        first_name,
        last_name,
        address,
        is_active: true,
        is_superuser: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('Register Error:', error);
      return res.status(500).json({ error: 'Failed to register' });
    }

    // Remove sensitive data before returning
    const { hashed_password: _, ...safeUser } = data;

    return res.status(201).json({
      message: 'User registered successfully',
      user: safeUser
    });

  } catch (error) {
    console.error('Register API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
