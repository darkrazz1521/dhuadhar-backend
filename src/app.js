const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();
const salesRoutes = require('./routes/sales.routes');
const priceRoutes = require('./routes/price.routes');
const reportRoutes = require('./routes/report.routes');
const advanceRoutes = require('./routes/advance.routes');
const creditRoutes = require('./routes/credit.routes');
const landRoutes = require('./routes/land.routes');
const coalRoutes = require('./routes/coal.routes');




app.use(cors());
app.use(express.json());


// routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/advance', advanceRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/land', landRoutes);
app.use('/api/coal', coalRoutes);

// health check
app.get('/', (req, res) => {
  res.json({ status: 'Dhuadhar backend running' });
});

module.exports = app;
