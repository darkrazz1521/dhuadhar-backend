const LandExpense = require('../models/LandExpense');

// GET all land expenses
exports.getLandExpenses = async (req, res) => {
  try {
    const data = await LandExpense.find().sort({ paidDate: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE land expense
exports.createLandExpense = async (req, res) => {
  try {
    const { landType, month, amount, paidDate, notes } = req.body;

    if (!landType || !month || amount == null || !paidDate) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const expense = await LandExpense.create({
      landType,
      month,
      amount,
      paidDate,
      notes,
    });

    res.status(201).json(expense);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
