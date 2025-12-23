const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');
const LabourPayment = require('../models/LabourPayment');

/**
 * --------------------------------------------------
 * LABOUR BOARD SUMMARY (OWNER VIEW)
 * --------------------------------------------------
 * Covers:
 * - Total active labour
 * - Daily wages (current month)
 * - Salary expected / paid / pending
 * - Total labour cost
 * --------------------------------------------------
 */
exports.getLabourBoard = async (req, res) => {
  try {
    /* ---------------- DATE CONTEXT ---------------- */
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const month = today.substring(0, 7); // YYYY-MM

    /* ---------------- TOTAL ACTIVE LABOUR ---------------- */
    const totalLabour = await Labour.countDocuments({
      isActive: true,
    });

    /* ---------------- DAILY LABOUR WAGES (MONTH) ---------------- */
    const dailyWagesAgg = await LabourAttendance.aggregate([
      {
        $match: {
          date: { $regex: `^${month}` },
          present: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$wage' },
        },
      },
    ]);

    const dailyWages = dailyWagesAgg[0]?.total || 0;

    /* ---------------- SALARY LABOUR (FIXED MONTHLY) ---------------- */
    const salaryLabours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const expectedSalary = salaryLabours.reduce(
      (sum, l) => sum + (l.monthlySalary || 0),
      0
    );

    const paidSalaryAgg = await LabourPayment.aggregate([
      {
        $match: { month },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const salaryPaid = paidSalaryAgg[0]?.total || 0;
    const salaryPending = Math.max(expectedSalary - salaryPaid, 0);

    /* ---------------- TOTAL LABOUR COST ---------------- */
    const totalLabourCost = dailyWages + expectedSalary;

    /* ---------------- RESPONSE ---------------- */
    res.json({
      totalLabour,

      dailyWages,

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
