const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User, Request, Record } = require('./models');
const SECRET = process.env.JWT_SECRET || 'devsecret';
const sign = u => jwt.sign({ id: u._id, role: u.role }, SECRET, { expiresIn: '7d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone });
const auth = (q, s, n) => { try { q.user = jwt.verify((q.headers.authorization || '').split(' ')[1], SECRET); n(); } catch { s.status(401).json({ message: 'Please log in again' }); } };
const admin = (q, s, n) => q.user.role === 'admin' ? n() : s.status(403).json({ message: 'Admins only' });
const wrap = f => (q, s, n) => f(q, s, n).catch(e => s.status(400).json({ message: e.message }));

r.post('/auth/register', wrap(async (q, s) => {
  const { name, email, password, phone } = q.body;
  if (!name || !email || !password || password.length < 6) throw new Error('Name, email and a password of 6+ characters are required');
  if (await User.findOne({ email: email.toLowerCase() })) throw new Error('This email is already registered');
  const u = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10) });
  s.json({ token: sign(u), user: pub(u) });
}));
r.post('/auth/login', wrap(async (q, s) => {
  const u = await User.findOne({ email: (q.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.password))) throw new Error('Invalid email or password');
  s.json({ token: sign(u), user: pub(u) });
}));
r.get('/auth/me', auth, wrap(async (q, s) => s.json(pub(await User.findById(q.user.id)))));

r.get('/requests', auth, wrap(async (q, s) =>
  s.json(await Request.find(q.user.role === 'admin' ? {} : { user: q.user.id }).populate('user', 'name email phone').sort('-createdAt'))));
r.post('/requests', auth, wrap(async (q, s) => {
  const { deviceType, brand, model, quantity, condition, description, address, preferredDate, preferredTime } = q.body;
  s.json(await Request.create({ user: q.user.id, deviceType, brand, model, quantity, condition, description, address, preferredTime, preferredDate: preferredDate || undefined }));
}));
r.patch('/requests/:id', auth, admin, wrap(async (q, s) => {
  const { status, scheduledDate, adminNote } = q.body;
  s.json(await Request.findByIdAndUpdate(q.params.id, { status, scheduledDate: scheduledDate || undefined, adminNote }, { new: true, omitUndefined: true, runValidators: true }));
}));
r.delete('/requests/:id', auth, wrap(async (q, s) => {
  const f = q.user.role === 'admin' ? { _id: q.params.id } : { _id: q.params.id, user: q.user.id, status: 'Pending' };
  if (!(await Request.findOneAndDelete(f))) throw new Error('This request cannot be cancelled');
  s.json({ ok: true });
}));

r.get('/admin/users', auth, admin, wrap(async (q, s) => s.json(await User.find({ role: 'user' }).select('-password').sort('-createdAt'))));
r.delete('/admin/users/:id', auth, admin, wrap(async (q, s) => {
  await User.findOneAndDelete({ _id: q.params.id, role: 'user' }); await Request.deleteMany({ user: q.params.id }); s.json({ ok: true });
}));
r.get('/admin/records', auth, admin, wrap(async (q, s) =>
  s.json(await Record.find().populate({ path: 'request', select: 'deviceType brand model quantity user', populate: { path: 'user', select: 'name' } }).sort('-createdAt'))));
r.post('/admin/records', auth, admin, wrap(async (q, s) => {
  const rec = await Record.create(q.body);
  await Request.findByIdAndUpdate(q.body.request, { status: q.body.outcome === 'Disposed' ? 'Disposed' : 'Recycled' });
  s.json(rec);
}));
r.get('/admin/stats', auth, admin, wrap(async (q, s) => {
  const by = await Request.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const w = await Record.aggregate([{ $group: { _id: null, kg: { $sum: '$weightKg' } } }]);
  s.json({ users: await User.countDocuments({ role: 'user' }), total: await Request.countDocuments(), byStatus: Object.fromEntries(by.map(x => [x._id, x.n])), recycledKg: w[0]?.kg || 0 });
}));
module.exports = r;
