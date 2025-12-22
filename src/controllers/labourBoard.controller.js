const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');
const LabourPayment = require('../models/LabourPayment');

exports.getLabourBoard = async (req, res) => {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const month = today.substring(0, 7);

    // TOTAL ACTIVE LABOUR
    const totalLabour = await Labour.countDocuments({
      isActive: true,
    });

    // DAILY LABOUR WAGES (MONTH)
    const dailyWages = await LabourAttendance.aggregate([
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

    // SALARY LABOUR
    const salaryLabours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const expectedSalary = salaryLabours.reduce(
      (sum, l) => sum + (l.monthlySalary || 0),
      0
    );

    const paidSalary = await LabourPayment.aggregate([
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

    const salaryPaid = paidSalary[0]?.total || 0;
    const salaryPending = Math.max(
      expectedSalary - salaryPaid,
      0
    );

    const totalLabourCost =
      (dailyWages[0]?.total || 0) + expectedSalary;

    res.json({
      totalLabour,
      dailyWages: dailyWages[0]?.total || 0,
      salary: {
        expected: expectedSalary,
        paid: salaryPaid,
        pending: salaryPending,
      },
      totalLabourCost,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
