const Credit = require('../models/Credit');
const Customer = require('../models/Customer');
const CreditPayment = require('../models/CreditPayment');

/**
 * --------------------------------------------------
 * GET ALL CREDITS (CUSTOMER-WISE)
 * Used in Credit Screen
 * --------------------------------------------------
 */
exports.getCredits = async (req, res) => {
  try {
    const credits = await Credit.find()
      .populate('customerId', 'name')
      .sort({ totalDue: -1 });

    res.json(credits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * --------------------------------------------------
 * GET SINGLE CUSTOMER CREDIT DETAIL
 * --------------------------------------------------
 */
exports.getCreditByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const credit = await Credit.findOne({ customerId })
      .populate('customerId', 'name');

    if (!credit) {
      return res.status(404).json({ message: 'No credit found' });
    }

    res.json(credit);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * --------------------------------------------------
 * CLEAR / ADJUST CREDIT (OWNER ONLY)
 * Records payment history ✔️
 * --------------------------------------------------
 */
exports.clearCredit = async (req, res) => {
  try {
    const { customerId, amount } = req.body;

    if (!customerId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid fields' });
    }

    const credit = await Credit.findOne({ customerId });
    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    // Update credit
    credit.totalDue = Math.max(credit.totalDue - amount, 0);
    await credit.save();

    // 🧾 SAVE PAYMENT HISTORY
    await CreditPayment.create({
      customerId,
      amount,
      receivedBy: req.user.id,
    });

    res.json({
      message: 'Credit updated',
      credit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * --------------------------------------------------
 * GET CREDIT PAYMENT HISTORY (CUSTOMER-WISE)
 * --------------------------------------------------
 */
exports.getCreditPayments = async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await CreditPayment.find({ customerId })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
