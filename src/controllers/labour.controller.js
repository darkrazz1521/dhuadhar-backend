const Labour = require('../models/Labour');

// GET all labour
exports.getLabours = async (req, res) => {
  try {
    const data = await Labour.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE labour
exports.createLabour = async (req, res) => {
  try {
    const { name, mobile, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const labour = await Labour.create({
      name,
      mobile,
      type,
    });

    res.status(201).json(labour);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// TOGGLE active/inactive
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
