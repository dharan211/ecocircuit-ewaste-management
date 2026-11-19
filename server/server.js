require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const { User } = require('./models');
const app = express();
app.use(cors(), express.json());
app.use('/api', require('./routes'));
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecocircuit').then(async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@ecocircuit.com';
  if (!(await User.findOne({ email })))
    await User.create({ name: 'Admin', email, role: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
  app.listen(process.env.PORT || 5000, () => console.log('API running on port ' + (process.env.PORT || 5000)));
}).catch(e => console.error('MongoDB connection failed:', e.message));
