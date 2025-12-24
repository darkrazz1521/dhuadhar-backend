const Credit = require('../models/Credit');
const CreditPayment = require('../models/CreditPayment');
const Sale = require('../models/Sale');
const SalePayment = require('../models/SalePayment');

/**
 * --------------------------------------------------
 * GET ALL CREDITS (CUSTOMER-WISE)
 * Used in Credit Screen
 * --------------------------------------------------
 */
exports.getCredits = async (req, res) => {
  try {
    const credits = await Credit.find()
      // ✅ UI STANDARD POPULATE (FINAL)
      .populate('customerId', 'name mobile address')
      .sort({ totalDue: -1 });

    res.json(credits);
  } catch (error) {
    console.error('GET CREDITS ERROR:', error);
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
      // ✅ UI STANDARD POPULATE (FINAL)
      .populate('customerId', 'name mobile address');

    if (!credit) {
      return res.status(404).json({ message: 'No credit found' });
    }

    res.json(credit);
  } catch (error) {
    console.error('GET CREDIT BY CUSTOMER ERROR:', error);
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

    let credit = await Credit.findOne({ customerId });

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    // ✅ Reduce credit safely
    credit.totalDue = Math.max(credit.totalDue - amount, 0);
    await credit.save();

    // 🧾 SAVE PAYMENT HISTORY
    await CreditPayment.create({
      customerId,
      amount,
      receivedBy: req.user.id,
    });

    res.json({
      message: 'Credit updated successfully',
      credit,
    });
  } catch (error) {
    console.error('CLEAR CREDIT ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// CUSTOMER CREDIT SUMMARY
// --------------------------------------------------
exports.getCustomerCreditSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const credit = await Credit.findOne({ customerId })
      .populate('customerId', 'name mobile address');

    if (!credit) {
      return res.json({
        totalDue: 0,
        sales: [],
        payments: [],
      });
    }

    const sales = await Sale.find({
      customerId,
  due: { $gt: 0 },
    }).sort({ createdAt: -1 });

    const payments = await CreditPayment.find({ customerId })
      .sort({ createdAt: -1 });

    res.json({
      customer: credit.customerId,
      totalDue: credit.totalDue,
      sales,
      payments,
    });
  } catch (e) {
    console.error(e);
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
  } catch (error) {
    console.error('GET CREDIT PAYMENTS ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.paySale = async (req, res) => {
  try {
    const { saleId, amount } = req.body;

    if (!saleId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid fields' });
    }

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (amount > sale.due) {
      return res
        .status(400)
        .json({ message: 'Amount exceeds sale due' });
    }

    // 1️⃣ Update sale
    sale.paid += amount;
    sale.due -= amount;
    await sale.save();

    // 2️⃣ Update credit
    const credit = await Credit.findOne({
      customerId: sale.customerId,
    });

    if (credit) {
      credit.totalDue = Math.max(credit.totalDue - amount, 0);
      await credit.save();
    }

    // 3️⃣ Save sale payment history
    await SalePayment.create({
      saleId: sale._id,
      customerId: sale.customerId,
      amount,
      receivedBy: req.user.id,
    });

    // 4️⃣ (Optional) Save customer credit history
    await CreditPayment.create({
      customerId: sale.customerId,
      amount,
      receivedBy: req.user.id,
    });

    res.json({
      message: 'Sale payment recorded successfully',
      sale,
    });
  } catch (error) {
    console.error('PAY SALE ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
