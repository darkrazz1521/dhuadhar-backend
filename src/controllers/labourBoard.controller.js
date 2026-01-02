const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');
const Payment = require('../models/Payment'); // ✅ NEW Model
const ProductionEntry = require('../models/ProductionEntry'); // ✅ Needed for wages

/**
 * --------------------------------------------------
 * LABOUR BOARD SUMMARY (OWNER VIEW)
 * --------------------------------------------------
 */
exports.getLabourBoard = async (req, res) => {
  try {
    /* ---------------- DATE CONTEXT ---------------- */
    const today = new Date().toISOString().substring(0, 10);
    const month = today.substring(0, 7); // YYYY-MM

    /* ---------------- 1. TOTAL ACTIVE LABOUR ---------------- */
    const totalLabour = await Labour.countDocuments({
      isActive: true,
    });

    /* ---------------- 2. CALCULATE EARNINGS (Daily + Production) ---------------- */
    
    // A. Production Wages (Moulders, Loaders, Kiln)
    // We sum up the 'wage' field from ProductionEntry for this month
    const productionAgg = await ProductionEntry.aggregate([
      { 
        $match: { date: { $regex: `^${month}` } } 
      },
      { 
        $group: { _id: null, total: { $sum: '$wage' } } 
      },
    ]);
    const productionWages = productionAgg[0]?.total || 0;

    // B. Daily Labour Wages (Manual Calculation)
    // Since Attendance doesn't store 'wage', we calculate: Rate * Days
    const dailyAttendance = await LabourAttendance.find({
      date: { $regex: `^${month}` },
      status: { $in: ['P', 'H'] } // Present or Half Day
    }).populate('labourId');

    let dailyWages = 0;
    dailyAttendance.forEach((att) => {
      if (att.labourId && att.labourId.category === 'daily') {
        const rate = att.labourId.dailyRate || 0;
        const multiplier = att.status === 'H' ? 0.5 : 1.0;
        dailyWages += (rate * multiplier);
      }
    });

    const totalVariableWages = productionWages + dailyWages;

    /* ---------------- 3. FIXED SALARY (Monthly) ---------------- */
    // Drivers, Cooks, Munshis
    const salaryLabours = await Labour.find({
      category: 'salary', 
      isActive: true,
    });

    const expectedSalary = salaryLabours.reduce(
      (sum, l) => sum + (l.monthlySalary || 0),
      0
    );

    /* ---------------- 4. PAYMENTS MADE ---------------- */
    // Using the NEW Payment model
    const paidSalaryAgg = await Payment.aggregate([
      {
        $match: { paymentDate: { $regex: `^${month}` } },
      },
      {
        $group: { 
          _id: null, 
          // We count 'grossAmount' because that's the total value cleared (Cash + Advance)
          total: { $sum: '$grossAmount' } 
        },
      },
    ]);

    const salaryPaid = paidSalaryAgg[0]?.total || 0;
    
    // Simple logic: If we paid less than expected monthly cost, show pending
    // (This is an estimate, as payments might overlap months)
    const salaryPending = Math.max(expectedSalary - salaryPaid, 0);

    /* ---------------- 5. TOTAL MONTHLY LIABILITY ---------------- */
    // Variable Earnings (Real work done) + Fixed Salary (Expected)
    const totalLabourCost = totalVariableWages + expectedSalary;

    /* ---------------- RESPONSE ---------------- */
    res.json({
      totalLabour,

      // Renamed to 'wages' for clarity, covers Daily + Production
      dailyWages: totalVariableWages,

      salary: {
        expected: expectedSalary,
        paid: salaryPaid,
        pending: salaryPending,
      },

      totalLabourCost,
    });
  } catch (error) {
    console.error('LABOUR BOARD ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};