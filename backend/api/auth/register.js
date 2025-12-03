const { supabase } = require('../../lib/supabaseClient');
const { hashPassword } = require('../../lib/bcrypt');

module.exports = async function handler(req, res) {
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
      address,
      age
    } = req.body;

    // Check required fields
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, username'
      });
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

    // Insert user
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
        age,
        is_active: true,
        is_superuser: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('Register Error:', error);
      return res.status(500).json({ error: 'Failed to register' });
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: data
    });

  } catch (error) {
    console.error('Register API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
