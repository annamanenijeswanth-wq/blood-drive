const mongoose = require('mongoose');
const GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','donor'], default: 'donor' }
}, { timestamps: true }));
const Campaign = mongoose.model('Campaign', new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  bloodGroupsNeeded: [{ type: String, enum: GROUPS }],
  capacity: { type: Number, default: 50, min: 1 },
  description: String,
  status: { type: String, enum: ['Upcoming','Completed','Cancelled'], default: 'Upcoming' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));
const donorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  name: { type: String, required: true },
  phone: String,
  bloodGroup: { type: String, enum: GROUPS, required: true },
  status: { type: String, enum: ['Registered','Donated','Cancelled'], default: 'Registered' }
}, { timestamps: true });
donorSchema.index({ user: 1, campaign: 1 }, { unique: true });
const Donor = mongoose.model('Donor', donorSchema);
const stock = Object.fromEntries(GROUPS.map(g => [g, { type: Number, default: 0, min: 0 }]));
const BloodCenter = mongoose.model('BloodCenter', new mongoose.Schema({
  name: { type: String, required: true }, city: { type: String, required: true }, state: String,
  address: String, phone: String, stock
}, { timestamps: true }));
const BloodRequest = mongoose.model('BloodRequest', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true }, bloodGroup: { type: String, enum: GROUPS, required: true },
  units: { type: Number, default: 1, min: 1 }, hospital: { type: String, required: true }, city: { type: String, required: true },
  contact: { type: String, required: true }, urgency: { type: String, enum: ['Critical','Urgent','Normal'], default: 'Urgent' },
  status: { type: String, enum: ['Open','Fulfilled','Closed'], default: 'Open' }
}, { timestamps: true }));
module.exports = { User, Campaign, Donor, BloodCenter, BloodRequest, GROUPS };
