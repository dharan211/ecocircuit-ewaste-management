require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User, Request, Record } = require('./models');
const day = n => new Date(Date.now() + n * 864e5);

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocircuit');

  // remove any earlier sample data so this script can be re-run safely
  const old = await User.find({ email: /@sample\.com$/ });
  const ids = old.map(u => u._id);
  const oldReqs = await Request.find({ user: { $in: ids } });
  await Record.deleteMany({ request: { $in: oldReqs.map(r => r._id) } });
  await Request.deleteMany({ user: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });

  const password = await bcrypt.hash('user123', 10);
  const names = [['Arun Kumar', 'arun'], ['Priya Nair', 'priya'], ['Karthik R', 'karthik'], ['Meena S', 'meena'], ['Rahul V', 'rahul']];
  const users = await User.insertMany(names.map(([name, k], i) => ({ name, email: k + '@sample.com', phone: '98400000' + (10 + i), password })));
  const addr = ['12 Anna Nagar, Chennai', '45 T Nagar, Chennai', '7 Adyar, Chennai', '88 Velachery, Chennai', '23 OMR, Sholinganallur, Chennai'];

  const items = [
    ['Laptop', 'Dell', 'Inspiron 15', 1, 'Dead', 'Pending'],
    ['Mobile phone', 'Samsung', 'Galaxy J7', 2, 'Damaged', 'Pending'],
    ['Monitor / TV', 'LG', '22 inch LCD', 1, 'Working', 'Approved'],
    ['Desktop / CPU', 'HP', 'Pavilion', 1, 'Dead', 'Scheduled'],
    ['Battery / Charger', 'Anker', 'Power bank', 3, 'Damaged', 'Scheduled'],
    ['Printer', 'Canon', 'Pixma', 1, 'Dead', 'Collected'],
    ['Laptop', 'Lenovo', 'ThinkPad T450', 1, 'Working', 'Recycled'],
    ['Mobile phone', 'Apple', 'iPhone 6', 1, 'Dead', 'Recycled'],
    ['Monitor / TV', 'Samsung', 'CRT TV', 1, 'Dead', 'Disposed'],
    ['Other', 'Generic', 'Cables bundle', 10, 'Working', 'Rejected'],
  ];
  const reqs = await Request.insertMany(items.map(([deviceType, brand, model, quantity, condition, status], i) => ({
    user: users[i % users.length]._id, deviceType, brand, model, quantity, condition, status,
    address: addr[i % addr.length], preferredDate: day(-8 + i), preferredTime: ['Morning', 'Afternoon', 'Evening'][i % 3],
    scheduledDate: status === 'Scheduled' ? day(1 + (i % 4)) : ['Collected', 'Recycled', 'Disposed'].includes(status) ? day(-3) : undefined,
    adminNote: status === 'Rejected' ? 'Not enough items to schedule a pickup' : status === 'Approved' ? 'Approved, we will confirm a date soon' : undefined,
  })));

  const rec = (i, outcome, weightKg, materials, recycler, method) => ({ request: reqs[i]._id, outcome, weightKg, materials, recycler, method });
  await Record.insertMany([
    rec(6, 'Recycled', 2.1, 'Aluminium, copper, plastic', 'GreenTech Recyclers', 'Dismantling'),
    rec(7, 'Recycled', 0.2, 'Gold, copper, lithium', 'GreenTech Recyclers', 'Shredding and recovery'),
    rec(8, 'Disposed', 14.5, 'Glass, lead, plastic', 'State Hazardous Waste Facility', 'Safe disposal'),
  ]);

  console.log('Sample data added. Sample logins: arun@sample.com (and priya, karthik, meena, rahul) / user123');
  process.exit(0);
})().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });