const r = require('express').Router();
const { Campaign, Donor } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const prioritise = require('../greedy');
r.get('/', async (req, res) => {
  const { status, location } = req.query, q = {};
  if (status) q.status = status;
  if (location) q.location = new RegExp(location, 'i');
  const list = await Campaign.find(q).sort({ date: 1 }).lean();
  const counts = await Donor.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: '$campaign', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map(c => [String(c._id), c.n]));
  res.json(list.map(c => ({ ...c, registered: map[String(c._id)] || 0 })));
});
// Greedy: top-N registered donors, urgent blood groups first (admin only)
r.get('/:id/priority', auth, adminOnly, async (req, res) => {
  const c = await Campaign.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Campaign not found.' });
  const donors = await Donor.find({ campaign: c._id });
  res.json(prioritise(donors, c.bloodGroupsNeeded, Math.max(1, +req.query.slots || 10)));
});
r.get('/:id', async (req, res) => {
  const c = await Campaign.findById(req.params.id);
  c ? res.json(c) : res.status(404).json({ message: 'Campaign not found.' });
});
r.post('/', auth, adminOnly, async (req, res) => {
  try { res.status(201).json(await Campaign.create({ ...req.body, createdBy: req.user.id })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
r.put('/:id', auth, adminOnly, async (req, res) => {
  try { res.json(await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
r.delete('/:id', auth, adminOnly, async (req, res) => {
  await Campaign.findByIdAndDelete(req.params.id);
  await Donor.deleteMany({ campaign: req.params.id });
  res.json({ message: 'Campaign deleted.' });
});
module.exports = r;
