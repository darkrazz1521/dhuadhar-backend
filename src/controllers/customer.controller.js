const Customer = require('../models/Customer');

// SEARCH + LIST
exports.searchCustomers = async (req, res) => {
  try {
    const q = req.query.q || '';

    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q } },
        { address: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(20)
      .sort({ updatedAt: -1 });

    res.json(customers);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// CREATE CUSTOMER
exports.createCustomer = async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    if (!name || !mobile || !address) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const customer = await Customer.create({
      name,
      mobile,
      address,
    });

    res.status(201).json(customer);
  } catch (e) {
    if (e.code === 11000) {
      return res
        .status(409)
        .json({ message: 'Mobile already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// GET all customers (for UI)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .select('name mobile address');

    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
