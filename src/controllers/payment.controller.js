const Labour = require('../models/Labour');
const LabourPayment = require('../models/LabourPayment');

// GET salary labour list with summary
exports.getSalaryLabours = async (req, res) => {
  try {
    const { month } = req.query;

    const labours = await Labour.find({
      type: { $in: ['munshi', 'driver', 'cook'] },
      isActive: true,
    });

    const payments = await LabourPayment.find({ month });

    const map = {};
    payments.forEach(p => {
      if (!map[p.labourId]) map[p.labourId] = 0;
      map[p.labourId] += p.amount;
    });

    const result = labours.map(l => ({
      labourId: l._id,
      name: l.name,
      type: l.type,
      monthlySalary: l.monthlySalary || 0,
      paid: map[l._id] || 0,
      pending: Math.max(
        (l.monthlySalary || 0) - (map[l._id] || 0),
        0
      ),
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PAY salary
exports.paySalary = async (req, res) => {
  try {
    const { labourId, month, amount, notes } = req.body;

    if (!labourId || !month || !amount) {
      return res.status(400).json({ message: 'Missing data' });
    }

    await LabourPayment.create({
      labourId,
      month,
      amount,
      paidDate: new Date(),
      notes,
    });

    res.status(201).json({ message: 'Salary paid' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
