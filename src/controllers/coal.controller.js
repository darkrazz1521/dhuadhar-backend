const CoalExpense = require('../models/CoalExpense');

// GET all coal expenses
exports.getCoalExpenses = async (req, res) => {
  try {
    const data = await CoalExpense.find().sort({ date: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE coal expense
exports.createCoalExpense = async (req, res) => {
  try {
    const { date, supplier, quantity, rate, notes } = req.body;

    if (!date || !supplier || !quantity || !rate) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const total = quantity * rate;

    const expense = await CoalExpense.create({
      date,
      supplier,
      quantity,
      rate,
      total,
      notes,
    });

    res.status(201).json(expense);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
