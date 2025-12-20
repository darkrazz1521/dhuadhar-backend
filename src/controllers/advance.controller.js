const Advance = require('../models/Advance');
const Customer = require('../models/Customer');
const Price = require('../models/Price');
const Sale = require('../models/Sale');
const Credit = require('../models/Credit');

/* --------------------------------------------------
   CREATE ADVANCE ORDER
-------------------------------------------------- */
exports.createAdvance = async (req, res) => {
  try {
    const { customerName, category, quantity, advance } = req.body;

    if (!customerName || !category || !quantity || advance == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1️⃣ Find or create customer
    let customer = await Customer.findOne({ name: customerName });
    if (!customer) {
      customer = await Customer.create({ name: customerName });
    }

    // 2️⃣ Get owner-set price
    const price = await Price.findOne({ category });
    if (!price) {
      return res
        .status(400)
        .json({ message: 'Price not set by owner' });
    }

    const rate = price.rate;
    const total = rate * quantity;
    const remaining = Math.max(total - advance, 0);

    // 3️⃣ Save advance order
    const order = await Advance.create({
      customerId: customer._id,
      category,
      rate,
      quantity,
      remainingQuantity: quantity, // 🧱 NEW
      deliveredQuantity: 0,         // 🧱 NEW
      total,
      advance,
      remaining,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Advance order created',
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   GET ALL ADVANCE ORDERS
-------------------------------------------------- */
exports.getAdvances = async (req, res) => {
  try {
    const advances = await Advance.find()
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    res.json(advances);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   FULL DELIVERY → CONVERT TO SALE (OWNER)
-------------------------------------------------- */
exports.convertToSale = async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    if (advance.status === 'delivered') {
      return res.status(400).json({ message: 'Already delivered' });
    }

    // 1️⃣ Create sale
    await Sale.create({
      customerId: advance.customerId,
      category: advance.category,
      rate: advance.rate,
      quantity: advance.remainingQuantity,
      total: advance.remainingQuantity * advance.rate,
      paid: advance.advance,
      due: advance.remaining,
    });

    // 2️⃣ Update credit
    if (advance.remaining > 0) {
      let credit = await Credit.findOne({
        customerId: advance.customerId,
      });

      if (!credit) {
        credit = await Credit.create({
          customerId: advance.customerId,
          totalDue: advance.remaining,
        });
      } else {
        credit.totalDue += advance.remaining;
        await credit.save();
      }
    }

    // 3️⃣ Update advance
    advance.deliveredQuantity = advance.quantity;
    advance.remainingQuantity = 0;
    advance.status = 'delivered';
    await advance.save();

    res.json({ message: 'Advance fully delivered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   PARTIAL DELIVERY (OWNER)
-------------------------------------------------- */
exports.partialDeliver = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliverQty } = req.body;

    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    if (
      deliverQty <= 0 ||
      deliverQty > advance.remainingQuantity
    ) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // 1️⃣ Calculate sale
    const saleTotal = deliverQty * advance.rate;

    // 2️⃣ Adjust advance payment
    const paidFromAdvance = Math.min(
      advance.advance,
      saleTotal
    );

    const due = saleTotal - paidFromAdvance;

    // 3️⃣ Create sale
    await Sale.create({
      customerId: advance.customerId,
      category: advance.category,
      rate: advance.rate,
      quantity: deliverQty,
      total: saleTotal,
      paid: paidFromAdvance,
      due,
    });

    // 4️⃣ Reduce advance money
    advance.advance -= paidFromAdvance;

    // 5️⃣ Update quantities
    advance.remainingQuantity -= deliverQty;
    advance.deliveredQuantity += deliverQty;

    // 6️⃣ Update credit (if due)
    if (due > 0) {
      let credit = await Credit.findOne({
        customerId: advance.customerId,
      });

      if (!credit) {
        credit = await Credit.create({
          customerId: advance.customerId,
          totalDue: due,
        });
      } else {
        credit.totalDue += due;
        await credit.save();
      }
    }

    // 7️⃣ Update status
    advance.status =
      advance.remainingQuantity === 0
        ? 'delivered'
        : 'partial';

    await advance.save();

    res.json({ message: 'Partial delivery recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
