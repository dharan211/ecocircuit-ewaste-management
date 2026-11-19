const m = require('mongoose'), S = m.Schema, ref = n => ({ type: S.Types.ObjectId, ref: n, required: true });
const User = m.model('User', new S({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, phone: String, role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true }));
const Request = m.model('Request', new S({
  user: ref('User'), deviceType: { type: String, required: true }, brand: String, model: String,
  quantity: { type: Number, default: 1, min: 1 }, condition: { type: String, enum: ['Working', 'Damaged', 'Dead'], default: 'Dead' },
  description: String, address: { type: String, required: true }, preferredDate: Date, preferredTime: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Morning' },
  status: { type: String, enum: ['Pending', 'Approved', 'Scheduled', 'Collected', 'Recycled', 'Disposed', 'Rejected'], default: 'Pending' },
  scheduledDate: Date, adminNote: String
}, { timestamps: true }));
const Record = m.model('Record', new S({
  request: ref('Request'), outcome: { type: String, enum: ['Recycled', 'Disposed'], default: 'Recycled' }, weightKg: Number, materials: String, recycler: String, method: String
}, { timestamps: true }));
module.exports = { User, Request, Record };
