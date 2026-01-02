const Credit = require('../models/Credit');
const Advance = require('../models/Advance'); // Sales Advances (Orders)
const Payment = require('../models/Payment'); // ✅ NEW Payment Model
const Labour = require('../models/Labour');

exports.getDashboardSummary = async (req, res) => {
  try {
    /* ---------------- 1. CREDIT DUE (Total Outstanding) ---------------- */
    const creditAgg = await Credit.aggregate([
      { $group: { _id: null, totalDue: { $sum: '$totalDue' } } },
    ]);

    /* ---------------- 2. PENDING ORDER ADVANCES ---------------- */
    // Counts sales advances not yet delivered
    const pendingAdvances = await Advance.countDocuments({
      status: { $ne: 'delivered' },
    });

    /* ---------------- 3. SALARY PENDING COUNT (This Month) ---------------- */
    const today = new Date().toISOString();
    const currentMonth = today.substring(0, 7); // YYYY-MM

    // A. Get all workers who are supposed to be paid monthly
    // (Drivers, Cooks, Munshis)
    const salaryLabours = await Labour.find({
      category: 'salary', // ✅ Updated to use 'category' field
      isActive: true,
    });

    // B. Get all payments made this month
    const paymentsThisMonth = await Payment.find({
      paymentDate: { $regex: `^${currentMonth}` }
    }).select('labourId');

    // Create a Set of IDs who have been paid
    const paidWorkerIds = new Set(
      paymentsThisMonth.map(p => p.labourId.toString())
    );

    // C. Count who hasn't been paid yet
    let salaryPendingCount = 0;
    salaryLabours.forEach((worker) => {
      if (!paidWorkerIds.has(worker._id.toString())) {
        salaryPendingCount++;
      }
    });

    res.json({
      creditDue: creditAgg[0]?.totalDue || 0,
      pendingAdvances,
      salaryPendingCount,
    });
  } catch (e) {
    console.error('DASHBOARD ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};