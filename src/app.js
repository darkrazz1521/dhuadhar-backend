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
const dieselRoutes = require('./routes/diesel.routes');
const electricityRoutes = require('./routes/electricity.routes');
const labourRoutes = require('./routes/labour.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const labourBoardRoutes = require('./routes/labourBoard.routes');
const productionRoutes = require('./routes/production.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
// ... other routes
const labourAdvanceRoutes = require('./routes/labourAdvance.routes');
const financeRoutes = require('./routes/finance.routes');
const labourProfileRoutes =
  require('./routes/labourProfile.routes');






















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
app.use('/api/diesel', dieselRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/labour-board', labourBoardRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/labour-advance', labourAdvanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api', labourProfileRoutes);


// health check
app.get('/', (req, res) => {
  res.json({ status: 'Dhuadhar backend running' });
});

module.exports = app;
