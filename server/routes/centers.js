const r = require('express').Router();
const { BloodCenter, GROUPS } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
// Total units available per blood group across all centers
r.get('/availability', async (req, res) => {
  const cs = await BloodCenter.find().lean();
  const totals = Object.fromEntries(GROUPS.map(g => [g, cs.reduce((n, c) => n + (c.stock?.[g] || 0), 0)]));
  res.json({ totals, centers: cs.length });
});
// Directory: ?city=&bloodGroup= (only centers that have stock of that group)
r.get('/', async (req, res) => {
  const q = {};
  if (req.query.city) q.city = new RegExp(req.query.city, 'i');
  if (req.query.bloodGroup) q['stock.' + req.query.bloodGroup] = { $gt: 0 };
  res.json(await BloodCenter.find(q).sort({ city: 1, name: 1 }));
});
r.post('/', auth, adminOnly, async (req, res) => {
  try { res.status(201).json(await BloodCenter.create(req.body)); } catch (e) { res.status(400).json({ message: e.message }); }
});
r.put('/:id', auth, adminOnly, async (req, res) => {
  try { res.json(await BloodCenter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
r.delete('/:id', auth, adminOnly, async (req, res) => { await BloodCenter.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted.' }); });
module.exports = r;
