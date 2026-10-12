const r = require('express').Router();
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models');
const sign = u => jwt.sign({ id: u._id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
r.post('/register', async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ character password are required.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'That email is already registered.' });
    const role = adminCode && adminCode === process.env.ADMIN_CODE ? 'admin' : 'donor';
    const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role });
    res.status(201).json({ token: sign(u), user: { name: u.name, role: u.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
r.post('/login', async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: sign(u), user: { name: u.name, role: u.role } });
});
module.exports = r;
