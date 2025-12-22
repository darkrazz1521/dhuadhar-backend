const ElectricityExpense = require('../models/ElectricityExpense');

// GET all electricity expenses
exports.getElectricityExpenses = async (req, res) => {
  try {
    const data = await ElectricityExpense.find().sort({
      paidDate: -1,
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE electricity expense
exports.createElectricityExpense = async (req, res) => {
  try {
    const { month, units, amount, paidDate, notes } = req.body;

    if (!month || !units || !amount || !paidDate) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const expense = await ElectricityExpense.create({
      month,
      units,
      amount,
      paidDate,
      notes,
    });

    res.status(201).json(expense);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
