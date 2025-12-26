const Customer = require('../models/Customer');

// ------------------------------------
// GET ALL CUSTOMERS (STEP-5)
// ------------------------------------
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ createdAt: -1 });

    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ------------------------------------
// SEARCH CUSTOMERS
// ------------------------------------
exports.searchCustomers = async (req, res) => {
  try {
    const q = req.query.q || '';

    const customers = await Customer.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
      ],
    }).limit(20);

    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ------------------------------------
   CREATE CUSTOMER (IMPROVED)
------------------------------------ */
exports.createCustomer = async (req, res) => {
  try {
    let { name, mobile, address } = req.body;

    if (!name || !mobile || !address) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // 1. Sanitize Data
    name = name.trim();
    mobile = mobile.trim();
    address = address.trim();

    // 2. Simple Mobile Validation (Optional but good)
    if (mobile.length < 10) {
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    const exists = await Customer.findOne({ mobile });
    if (exists) {
      return res.status(400).json({ message: 'Customer with this mobile already exists' });
    }

    const customer = await Customer.create({
      name,
      mobile,
      address,
    });

    res.status(201).json(customer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};