const Sale = require('../models/Sale');
const Advance = require('../models/Advance');

const LandExpense = require('../models/LandExpense');
const CoalExpense = require('../models/CoalExpense');
const DieselExpense = require('../models/DieselExpense');
const ElectricityExpense = require('../models/ElectricityExpense');

const LabourAttendance = require('../models/LabourAttendance');
const Labour = require('../models/Labour');

const SalePayment = require('../models/SalePayment');
const CreditPayment = require('../models/CreditPayment');

/* ======================================================
   📊 DASHBOARD SUMMARY (EXISTING – UNTOUCHED)
====================================================== */
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
      { $group: { _id: null, totalAdvance: { $sum: '$advance' } } },
    ]);

    const advance = advanceAgg[0]?.totalAdvance || 0;

    /* ================= EXPENDITURE ================= */
    const land = await LandExpense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const coal = await CoalExpense.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const diesel = await DieselExpense.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const electricity = await ElectricityExpense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);

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

    /* ================= LABOUR ================= */
    const month = new Date().toISOString().substring(0, 7);

    const dailyLabour = await LabourAttendance.aggregate([
      { $match: { date: { $regex: `^${month}` }, present: true } },
      { $group: { _id: null, total: { $sum: '$wage' } } },
    ]);

    const dailyCost = dailyLabour[0]?.total || 0;

    const salaryLabours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const salaryCost = salaryLabours.reduce(
      (sum, l) => sum + (l.monthlySalary || 0),
      0
    );

    const totalLabourCost = dailyCost + salaryCost;

    /* ================= PROFIT ================= */
    const profit =
      sales.totalSales -
      expenditure.total -
      totalLabourCost;

    res.json({
      sales,
      advance,
      expenditure,
      labour: {
        daily: dailyCost,
        salary: salaryCost,
        total: totalLabourCost,
      },
      profit,
    });
  } catch (e) {
    console.error('SUMMARY ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ======================================================
   📊 SALES BOARD REPORT (NEW – INTEGRATED)
====================================================== */
exports.getSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const salePayments = await SalePayment.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const creditPayments = await CreditPayment.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    let totalSales = 0;
    let totalBricks = 0;
    let totalCreditGiven = 0;
    let totalCollection = 0;

    const categories = {};
    const graph = {};

    sales.forEach((s) => {
      totalSales += s.total || 0;
      totalBricks += s.quantity || 0;
      totalCreditGiven += s.due || 0;

      if (!categories[s.category]) {
        categories[s.category] = { qty: 0, amount: 0 };
      }

      categories[s.category].qty += s.quantity;
      categories[s.category].amount += s.total;

      const dateKey = s.createdAt.toISOString().split('T')[0];
      graph[dateKey] = (graph[dateKey] || 0) + s.total;
    });

    const saleCollection = salePayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    const creditRecovery = creditPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    totalCollection = saleCollection + creditRecovery;

    res.json({
      summary: {
        totalSales,
        totalBricks,
        totalCreditGiven,
        totalCollection,
      },
      categories,
      graph,
    });
  } catch (e) {
    console.error('SALES REPORT ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
