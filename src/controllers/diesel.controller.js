const DieselExpense = require('../models/DieselExpense');

// GET all diesel expenses
exports.getDieselExpenses = async (req, res) => {
  try {
    const data = await DieselExpense.find().sort({ date: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE diesel expense
exports.createDieselExpense = async (req, res) => {
  try {
    const { date, purpose, litres, rate, notes } = req.body;

    if (!date || !purpose || !litres || !rate) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const total = litres * rate;

    const expense = await DieselExpense.create({
      date,
      purpose,
      litres,
      rate,
      total,
      notes,
    });

    res.status(201).json(expense);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
