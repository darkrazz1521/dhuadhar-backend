const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Credit = require('../models/Credit');
const Price = require('../models/Price');
const SalePayment = require('../models/SalePayment');

/* -------------------------------------------------------
 * CREATE SALE (customerId based – FINAL)
 * ----------------------------------------------------- */
exports.createSale = async (req, res) => {
  try {
    const {
  customerId,
  customerName,
  category,
  quantity,
  paid,
  transport,
  driver,
} = req.body;


    if (!category || !quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    /* ---------------- CUSTOMER RESOLUTION ---------------- */
    let customer = null;

    // ✅ Preferred flow
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(400).json({ message: 'Invalid customer' });
      }
    }
    // ⚠️ Backward compatibility
    else if (customerName) {
      customer = await Customer.findOne({ name: customerName });
      if (!customer) {
        customer = await Customer.create({ name: customerName });
      }
    } else {
      return res.status(400).json({ message: 'Customer required' });
    }

    /* ---------------- PRICE ---------------- */
    const price = await Price.findOne({ category });
    if (!price) {
      return res.status(400).json({
        message: 'Price not set for category',
      });
    }

    const rate = price.rate;
    const total = rate * quantity;
    const paidAmount = paid || 0;
    const due = Math.max(total - paidAmount, 0);

    /* ---------------- CREATE SALE ---------------- */
    const sale = await Sale.create({
  customerId: customer._id,
  category,
  rate,
  quantity,
  total,
  paid: paidAmount,
  due,

  // ✅ NEW FIELDS
  transport: transport || null,
  driver: driver || null,
});


    /* ---------------- ADVANCE PAYMENT (SALE-LEVEL) ---------------- */
    if (paidAmount > 0) {
      await SalePayment.create({
        saleId: sale._id,
        customerId: customer._id,
        amount: paidAmount,
        receivedBy: req.user.id,
      });
    }

    /* ---------------- CREDIT UPDATE ---------------- */
    if (due > 0) {
      let credit = await Credit.findOne({
        customerId: customer._id,
      });

      if (!credit) {
        await Credit.create({
          customerId: customer._id,
          totalDue: due,
        });
      } else {
        credit.totalDue += due;
        await credit.save();
      }
    }

    res.status(201).json({
      message: 'Sale created successfully',
      saleId: sale._id,
    });
  } catch (error) {
    console.error('SALE ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
 * GET SALES BY CUSTOMER (STEP-6.1)
 * -------------------------------------------------- */
exports.getSalesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const sales = await Sale.find({ customerId })
      .sort({ createdAt: -1 })
      .select('createdAt category quantity total paid due');

    res.json(sales);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
 * GET SALE FULL DETAIL + PAYMENT HISTORY (STEP-7)
 * -------------------------------------------------- */
exports.getSaleDetail = async (req, res) => {
  try {
    const { saleId } = req.params;

    const sale = await Sale.findById(saleId)
  .populate('customerId', 'name mobile address')
  .populate('driver', 'name mobile');


    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const payments = await SalePayment.find({ saleId })
      .sort({ createdAt: -1 });

    res.json({
      sale,
      payments,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -------------------------------------------------------
 * GET TODAY SALES (Sales Board)
 * ----------------------------------------------------- */
exports.getTodaySales = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    }).populate('customerId', 'name mobile address');

    res.json(sales);
  } catch (error) {
    console.error('GET TODAY SALES ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
 * PAY AGAINST A SPECIFIC SALE (STEP-8)
 * -------------------------------------------------- */
exports.paySale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const sale = await Sale.findById(saleId);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (sale.due <= 0) {
      return res.status(400).json({ message: 'No due on this sale' });
    }

    const payAmount = Math.min(amount, sale.due);

    /* -------- UPDATE SALE -------- */
    sale.paid += payAmount;
    sale.due -= payAmount;
    await sale.save();

    /* -------- SAVE SALE PAYMENT -------- */
    await SalePayment.create({
      saleId: sale._id,
      customerId: sale.customerId,
      amount: payAmount,
      receivedBy: req.user.id,
    });

    /* -------- UPDATE CREDIT -------- */
    const credit = await Credit.findOne({
      customerId: sale.customerId,
    });

    if (credit) {
      credit.totalDue = Math.max(credit.totalDue - payAmount, 0);
      await credit.save();
    }

    res.json({
      message: 'Payment recorded successfully',
      sale,
    });
  } catch (error) {
    console.error('PAY SALE ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

