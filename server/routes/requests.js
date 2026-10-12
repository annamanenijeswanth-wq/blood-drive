const r = require('express').Router();
const { BloodRequest } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const rank = { Critical: 0, Urgent: 1, Normal: 2 };
// Public: open emergency requests, most urgent first (?city=&bloodGroup=)
r.get('/', async (req, res) => {
  const q = { status: req.query.status || 'Open' };
  if (req.query.city) q.city = new RegExp(req.query.city, 'i');
  if (req.query.bloodGroup) q.bloodGroup = req.query.bloodGroup;
  const list = await BloodRequest.find(q).lean();
  res.json(list.sort((a, b) => rank[a.urgency] - rank[b.urgency] || b.createdAt - a.createdAt));
});
r.post('/', auth, async (req, res) => {
  try { res.status(201).json(await BloodRequest.create({ ...req.body, user: req.user.id, status: 'Open' })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
r.put('/:id', auth, async (req, res) => {
  const d = await BloodRequest.findById(req.params.id);
  if (!d) return res.status(404).json({ message: 'Request not found.' });
  if (req.user.role !== 'admin' && String(d.user) !== req.user.id) return res.status(403).json({ message: 'Not allowed.' });
  if (req.body.status) d.status = req.body.status;
  await d.save(); res.json(d);
});
r.delete('/:id', auth, adminOnly, async (req, res) => { await BloodRequest.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted.' }); });
module.exports = r;
