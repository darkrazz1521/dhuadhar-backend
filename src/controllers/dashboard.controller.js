const Credit = require('../models/Credit');
const Advance = require('../models/Advance');
const LabourPayment = require('../models/LabourPayment');
const Labour = require('../models/Labour');

exports.getDashboardSummary = async (req, res) => {
  try {
    // CREDIT DUE
    const creditAgg = await Credit.aggregate([
      { $group: { _id: null, totalDue: { $sum: '$totalDue' } } },
    ]);

    // PENDING ADVANCES
    const pendingAdvances = await Advance.countDocuments({
      status: { $ne: 'delivered' },
    });

    // SALARY PENDING COUNT
    const month = new Date().toISOString().substring(0, 7);

    const salaryLabours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const payments = await LabourPayment.aggregate([
      { $match: { month } },
      { $group: { _id: '$labourId', paid: { $sum: '$amount' } } },
    ]);

    const paidMap = {};
    payments.forEach(p => (paidMap[p._id] = p.paid));

    let salaryPendingCount = 0;
    salaryLabours.forEach(l => {
      const paid = paidMap[l._id] || 0;
      if ((l.monthlySalary || 0) > paid) salaryPendingCount++;
    });

    res.json({
      creditDue: creditAgg[0]?.totalDue || 0,
      pendingAdvances,
      salaryPendingCount,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
