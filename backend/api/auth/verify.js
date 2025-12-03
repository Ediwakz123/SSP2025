const { verifyToken } = require('../../lib/jwt');

module.exports = async function handler(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token)
      return res.status(401).json({ error: 'Token missing' });

    const decoded = verifyToken(token);

    if (!decoded)
      return res.status(401).json({ error: 'Invalid or expired token' });

    return res.status(200).json({
      valid: true,
      userId: decoded.userId
    });

  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
