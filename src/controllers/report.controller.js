const Sale = require('../models/Sale');
const Advance = require('../models/Advance');

// SUMMARY REPORT
exports.getSummary = async (req, res) => {
  try {
    // SALES AGGREGATION
    const salesSummary = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paid' },
          totalDue: { $sum: '$due' },
        },
      },
    ]);

    const salesData = salesSummary[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    // ADVANCE AGGREGATION
    const advanceSummary = await Advance.aggregate([
      {
        $group: {
          _id: null,
          totalAdvance: { $sum: '$advance' },
        },
      },
    ]);

    const advanceData = advanceSummary[0] || {
      totalAdvance: 0,
    };

    res.json({
      totalSales: salesData.totalSales,
      totalPaid: salesData.totalPaid,
      totalDue: salesData.totalDue,
      totalAdvance: advanceData.totalAdvance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
