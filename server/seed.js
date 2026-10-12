// Seeds the database with demo data. Usage: npm run seed
// WARNING: this deletes all existing users, campaigns and donors first.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Campaign, Donor, BloodCenter, BloodRequest } = require('./models');

const daysFromNow = n => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return d; };

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blood_drive');
  await Promise.all([User.deleteMany({}), Campaign.deleteMany({}), Donor.deleteMany({}), BloodCenter.deleteMany({}), BloodRequest.deleteMany({})]);

  const hash = await bcrypt.hash('password123', 10);
  const admin = await User.create({ name: 'Drive Organizer', email: 'admin@blooddrive.com', password: hash, role: 'admin' });
  const people = [
    ['Asha Reddy', 'O-', '9000000001'], ['Rahul Sharma', 'A+', '9000000002'], ['Meena Iyer', 'B+', '9000000003'],
    ['Karan Patel', 'O+', '9000000004'], ['Sneha Rao', 'AB+', '9000000005'], ['Vikram Singh', 'B-', '9000000006']
  ];
  const users = await User.insertMany(people.map(([name], i) => ({ name, email: `donor${i + 1}@blooddrive.com`, password: hash, role: 'donor' })));

  const campaigns = await Campaign.insertMany([
    { title: 'City Hospital Blood Drive', location: 'Hyderabad', date: daysFromNow(7), bloodGroupsNeeded: ['O-', 'B+'], capacity: 40, description: 'Urgent need for O- and B+ donors.', createdBy: admin._id },
    { title: 'University Campus Camp', location: 'Secunderabad', date: daysFromNow(14), bloodGroupsNeeded: ['A+', 'O+', 'AB+'], capacity: 100, description: 'Annual student donation camp.', createdBy: admin._id },
    { title: 'Community Hall Donation Day', location: 'Warangal', date: daysFromNow(30), bloodGroupsNeeded: ['B-', 'O-'], capacity: 30, description: 'Neighbourhood drive.', createdBy: admin._id },
    { title: 'Spring Charity Drive', location: 'Hyderabad', date: daysFromNow(-20), bloodGroupsNeeded: ['A+', 'B+'], capacity: 50, status: 'Completed', description: 'Past event.', createdBy: admin._id }
  ]);

  // [donor index, campaign index, status]
  const regs = [[0, 0, 'Registered'], [1, 0, 'Registered'], [2, 0, 'Registered'], [3, 1, 'Registered'], [4, 1, 'Registered'],
                [1, 1, 'Registered'], [5, 2, 'Registered'], [0, 2, 'Registered'], [2, 3, 'Donated'], [3, 3, 'Donated'], [4, 0, 'Cancelled']];
  await Donor.insertMany(regs.map(([u, c, status]) => ({
    user: users[u]._id, campaign: campaigns[c]._id, name: people[u][0], phone: people[u][2], bloodGroup: people[u][1], status
  })));

  const st = a => Object.fromEntries(['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((g, i) => [g, a[i]]));
  await BloodCenter.insertMany([
    { name: 'City Central Blood Bank', city: 'Hyderabad', state: 'Telangana', address: 'Koti Road', phone: '040-11110001', stock: st([25, 6, 30, 4, 8, 2, 40, 9]) },
    { name: 'Red Cross Blood Center', city: 'Hyderabad', state: 'Telangana', address: 'Banjara Hills', phone: '040-11110002', stock: st([12, 3, 15, 0, 5, 1, 22, 2]) },
    { name: 'Government Hospital Blood Bank', city: 'Warangal', state: 'Telangana', address: 'MGM Road', phone: '0870-2220003', stock: st([10, 2, 9, 1, 3, 0, 14, 4]) },
    { name: 'Lifeline Blood Center', city: 'Visakhapatnam', state: 'Andhra Pradesh', address: 'Dwaraka Nagar', phone: '0891-3330004', stock: st([18, 5, 20, 3, 6, 2, 28, 7]) }
  ]);
  await BloodRequest.insertMany([
    { user: users[0]._id, patientName: 'Ramesh K', bloodGroup: 'O-', units: 2, hospital: 'Apollo Hospital', city: 'Hyderabad', contact: '9100000001', urgency: 'Critical' },
    { user: users[2]._id, patientName: 'Lakshmi D', bloodGroup: 'B+', units: 1, hospital: 'MGM Hospital', city: 'Warangal', contact: '9100000002', urgency: 'Urgent' },
    { user: users[3]._id, patientName: 'Arun P', bloodGroup: 'A+', units: 3, hospital: 'KIMS', city: 'Hyderabad', contact: '9100000003', urgency: 'Normal' }
  ]);
  console.log(`Seeded: 1 admin, ${users.length} donors, ${campaigns.length} campaigns, ${regs.length} registrations`);
  console.log('Admin login : admin@blooddrive.com / password123');
  console.log('Donor login : donor1@blooddrive.com / password123 (donor1..donor6)');
  await mongoose.disconnect();
})().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
