const Labour = require('../models/Labour');
const LabourAdvance = require('../models/LabourAdvance');
const LabourAttendance = require('../models/LabourAttendance');
const Payment = require('../models/Payment');
// Import ProductionEntry if you have it (for Moulder/Kiln)
const ProductionEntry = require('../models/ProductionEntry'); 

// ====================================================
// 🔹 SECTION 1: ADVANCES (Kharcha)
// ====================================================

exports.addAdvance = async (req, res) => {
  try {
    const { labourId, date, amount, reason } = req.body;
    await LabourAdvance.create({ labourId, date, amount, reason });
    res.status(201).json({ message: 'Advance added' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdvances = async (req, res) => {
  try {
    const { labourId } = req.query;
    // Show newest first
    const data = await LabourAdvance.find({ labourId }).sort({ date: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ====================================================
// 🔹 SECTION 2: SALARY CALCULATION ENGINE
// ====================================================

exports.calculateDues = async (req, res) => {
  try {
    const { labourId } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // 1️⃣ Get Labour Details
    const labour = await Labour.findById(labourId);
    if (!labour) return res.status(404).json({ message: 'Labour not found' });

    // 2️⃣ Determine Start Date (Day after last payment)
    const lastPayment = await Payment.findOne({ labourId }).sort({ toDate: -1 });
    
    let startDate = '2024-01-01'; // Default for new workers
    if (lastPayment) {
      const last = new Date(lastPayment.toDate);
      last.setDate(last.getDate() + 1); // Next day
      startDate = last.toISOString().split('T')[0];
    }

    // 3️⃣ Fetch Unrecovered Advances (Total Kharcha)
    const advances = await LabourAdvance.find({ labourId, isRecovered: false });
    const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

    // 4️⃣ Calculate Earnings based on Category
    let grossAmount = 0;
    let presentDays = 0;
    let halfDays = 0;
    let totalProduction = 0;

    // --- CASE A: DAILY & SALARY (Attendance Based) ---
    if (labour.category === 'daily' || labour.category === 'salary') {
      const attendance = await LabourAttendance.find({
        labourId,
        date: { $gte: startDate, $lte: today },
      });

      presentDays = attendance.filter(a => a.status === 'P').length;
      halfDays = attendance.filter(a => a.status === 'H').length;
      const totalDays = presentDays + (halfDays * 0.5);

      if (labour.category === 'daily') {
        // Rate per Day
        grossAmount = Math.round(totalDays * (labour.dailyRate || 0));
      } else {
        // Monthly Salary (Assuming 30 days avg for simplicity, or use exact)
        // Formula: (Salary / 30) * Days Worked
        grossAmount = Math.round((totalDays / 30) * (labour.monthlySalary || 0));
      }
    }

    // --- CASE B: PRODUCTION (Moulder, Kiln, Chamber) ---
    else if (labour.category === 'production') {
      const production = await ProductionEntry.find({
        labourId,
        date: { $gte: startDate, $lte: today },
      });

      // Sum up bricks/count
      totalProduction = production.reduce((sum, p) => sum + (p.brickCount || 0), 0);
      
      // Formula: (Count / 1000) * Rate
      grossAmount = Math.round((totalProduction / 1000) * (labour.productionRate || 0));
    }

    // 5️⃣ Final Net
    const netPayable = grossAmount - totalAdvance;

    res.json({
      labourId,
      name: labour.name,
      period: { from: startDate, to: today },
      stats: { presentDays, halfDays, totalProduction },
      financials: {
        grossAmount,
        totalAdvance,
        netPayable,
      },
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ====================================================
// 🔹 SECTION 3: PAY & LOCK
// ====================================================

exports.createPayment = async (req, res) => {
  try {
    const { 
      labourId, paymentDate, fromDate, toDate, 
      grossAmount, advanceDeducted, netPaid, stats 
    } = req.body;

    // 1. Save Payment Record
    const payment = await Payment.create({
      labourId, paymentDate, fromDate, toDate,
      grossAmount, advanceDeducted, netPaid,
      totalDaysPresent: (stats?.presentDays || 0) + ((stats?.halfDays || 0) * 0.5),
      totalProduction: stats?.totalProduction || 0,
    });

    // 2. Clear Advances
    if (advanceDeducted > 0) {
      await LabourAdvance.updateMany(
        { labourId, isRecovered: false },
        { $set: { isRecovered: true, settledInPaymentId: payment._id } }
      );
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};