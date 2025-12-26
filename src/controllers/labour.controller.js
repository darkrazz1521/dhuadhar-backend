const Labour = require('../models/Labour');

// --------------------------------------------------
// GET LABOUR MASTER
// --------------------------------------------------
exports.getLabours = async (req, res) => {
  try {
    const data = await Labour.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// CREATE LABOUR (TC-LAB-01)
// --------------------------------------------------
exports.createLabour = async (req, res) => {
  try {
    const {
      name,
      mobile,
      category,
      workType,
      dailyRate,
      monthlySalary,
      productionRate,
    } = req.body;

    if (!name || !mobile || !category || !workType) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // ❌ Duplicate labour
    const exists = await Labour.findOne({ mobile });
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Labour already exists' });
    }

    const labour = {
      name,
      mobile,
      category,
      workType,
    };

    // Payment validation
    if (category === 'daily') {
      if (!dailyRate)
        return res
          .status(400)
          .json({ message: 'Daily rate required' });

      labour.dailyRate = dailyRate;
    }

    if (category === 'salary') {
      if (!monthlySalary)
        return res
          .status(400)
          .json({ message: 'Monthly salary required' });

      labour.monthlySalary = monthlySalary;
    }

    if (category === 'production') {
      if (!productionRate)
        return res
          .status(400)
          .json({ message: 'Production rate required' });

      labour.productionRate = productionRate;
    }

    const saved = await Labour.create(labour);
    res.status(201).json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// TOGGLE ACTIVE / INACTIVE
// --------------------------------------------------
exports.toggleLabourStatus = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Not found' });
    }

    labour.isActive = !labour.isActive;
    await labour.save();

    res.json(labour);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// GET ACTIVE DRIVERS ONLY
// --------------------------------------------------
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Labour.find({
      workType: 'Driver',
      isActive: true,
    }).sort({ name: 1 });

    res.json(drivers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

