const Sale = require('../models/Sale');
const Advance = require('../models/Advance');

const LandExpense = require('../models/LandExpense');
const CoalExpense = require('../models/CoalExpense');
const DieselExpense = require('../models/DieselExpense');
const ElectricityExpense = require('../models/ElectricityExpense');

const LabourAttendance = require('../models/LabourAttendance');
const Labour = require('../models/Labour');
const LabourPayment = require('../models/LabourPayment'); // (future use)

/**
 * 📊 SUMMARY REPORT
 * SALES + EXPENDITURE + LABOUR COST + PROFIT
 */
exports.getSummary = async (req, res) => {
  try {
    /* ================= SALES ================= */
    const salesAgg = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalPaid: { $sum: '$paid' },
          totalDue: { $sum: '$due' },
        },
      },
    ]);

    const sales = salesAgg[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    /* ================= ADVANCE ================= */
    const advanceAgg = await Advance.aggregate([
      {
        $group: {
          _id: null,
          totalAdvance: { $sum: '$advance' },
        },
      },
    ]);

    const advance = advanceAgg[0]?.totalAdvance || 0;

    /* ================= EXPENDITURE ================= */
    const land = await LandExpense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const coal = await CoalExpense.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const diesel = await DieselExpense.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const electricity = await ElectricityExpense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expenditure = {
      land: land[0]?.total || 0,
      coal: coal[0]?.total || 0,
      diesel: diesel[0]?.total || 0,
      electricity: electricity[0]?.total || 0,
    };

    expenditure.total =
      expenditure.land +
      expenditure.coal +
      expenditure.diesel +
      expenditure.electricity;

    /* ================= LABOUR COST ================= */
    const today = new Date().toISOString().substring(0, 10);
    const month = today.substring(0, 7); // YYYY-MM

    // 🔹 DAILY LABOUR (MONTH)
    const dailyLabour = await LabourAttendance.aggregate([
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

    const dailyLabourCost = dailyLabour[0]?.total || 0;

    // 🔹 SALARY LABOUR (MONTH)
    const salaryLabours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const salaryExpected = salaryLabours.reduce(
      (sum, l) => sum + (l.monthlySalary || 0),
      0
    );

    const totalLabourCost = dailyLabourCost + salaryExpected;

    /* ================= PROFIT ================= */
    const profit =
      sales.totalSales -
      expenditure.total -
      totalLabourCost;

    /* ================= RESPONSE ================= */
    res.json({
      sales,
      advance,
      expenditure: {
        ...expenditure,
        total: expenditure.total,
      },
      labour: {
        daily: dailyLabourCost,
        salary: salaryExpected,
        total: totalLabourCost,
      },
      profit,
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
