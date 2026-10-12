require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose');
const app = express();
app.use(cors()); app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/centers', require('./routes/centers'));
app.use('/api/requests', require('./routes/requests'));
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running on port', process.env.PORT || 5000)))
  .catch(e => console.error('MongoDB connection failed:', e.message));
