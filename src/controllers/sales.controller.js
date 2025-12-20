const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Credit = require('../models/Credit');
const Price = require('../models/Price');

// CREATE SALE
exports.createSale = async (req, res) => {
  try {
    const { customerName, category, quantity, paid } = req.body;

    if (!customerName || !category || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Fetch rate from Price (OWNER CONTROLLED)
    const price = await Price.findOne({ category });
    if (!price) {
      return res.status(400).json({ message: 'Price not set by owner' });
    }

    const rate = price.rate;

    // Find or create customer
    let customer = await Customer.findOne({ name: customerName });
    if (!customer) {
      customer = await Customer.create({ name: customerName });
    }

    // Calculate amounts
    const total = rate * quantity;
    const paidAmount = paid || 0;
    const due = Math.max(total - paidAmount, 0);

    // Create sale
    const sale = await Sale.create({
      customerId: customer._id,
      category,
      rate,
      quantity,
      total,
      paid: paidAmount,
      due,
    });

    // Update credit
    let credit = await Credit.findOne({ customerId: customer._id });
    if (!credit) {
      credit = await Credit.create({
        customerId: customer._id,
        totalDue: due,
      });
    } else {
      credit.totalDue += due;
      await credit.save();
    }

    res.status(201).json({
      message: 'Sale recorded successfully',
      sale,
      credit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET TODAY SALES
exports.getTodaySales = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      date: { $gte: start, $lte: end },
    }).populate('customerId', 'name');

    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
