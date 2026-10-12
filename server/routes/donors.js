const r = require('express').Router();
const { Donor, Campaign } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
r.use(auth);
// Admin sees all donors (filter by campaign / bloodGroup); donors see only their own.
r.get('/', async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { user: req.user.id };
  if (req.query.campaign) q.campaign = req.query.campaign;
  if (req.query.bloodGroup) q.bloodGroup = req.query.bloodGroup;
  res.json(await Donor.find(q).populate('campaign', 'title date location').sort({ createdAt: -1 }));
});
r.post('/', async (req, res) => {
  try {
    const c = await Campaign.findById(req.body.campaign);
    if (!c || c.status !== 'Upcoming') return res.status(400).json({ message: 'This campaign is not open for registration.' });
    const n = await Donor.countDocuments({ campaign: c._id, status: { $ne: 'Cancelled' } });
    if (n >= c.capacity) return res.status(400).json({ message: 'This campaign is full.' });
    res.status(201).json(await Donor.create({ ...req.body, user: req.user.id }));
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({ message: e.code === 11000 ? 'You are already registered for this campaign.' : e.message });
  }
});
r.put('/:id', async (req, res) => {
  const d = await Donor.findById(req.params.id);
  if (!d) return res.status(404).json({ message: 'Registration not found.' });
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && String(d.user) !== req.user.id) return res.status(403).json({ message: 'Not allowed.' });
  const { name, phone, bloodGroup, status } = req.body;
  Object.assign(d, { name: name ?? d.name, phone: phone ?? d.phone, bloodGroup: bloodGroup ?? d.bloodGroup });
  if (status && (isAdmin || status === 'Cancelled')) d.status = status; // donors may only cancel
  await d.save(); res.json(d);
});
r.delete('/:id', adminOnly, async (req, res) => { await Donor.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted.' }); });
module.exports = r;
