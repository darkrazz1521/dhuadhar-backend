const Advance = require('../models/Advance');
const Price = require('../models/Price');
const Sale = require('../models/Sale');
const Credit = require('../models/Credit');

/* --------------------------------------------------
   CREATE ADVANCE ORDER
-------------------------------------------------- */
exports.createAdvance = async (req, res) => {
  try {
    const { customerId, category, quantity, advance } = req.body;

    if (!customerId || !category || !quantity || advance == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const price = await Price.findOne({ category });
    if (!price) {
      return res.status(400).json({ message: 'Price not set by owner' });
    }

    const rate = price.rate;
    const total = rate * quantity;
    const remaining = Math.max(total - advance, 0);

    const order = await Advance.create({
      customerId,
      category,
      rate,
      quantity,
      remainingQuantity: quantity,
      deliveredQuantity: 0,
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
    console.error('CREATE ADVANCE ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   GET ALL ADVANCE ORDERS (UI LIST)
-------------------------------------------------- */
exports.getAdvances = async (req, res) => {
  try {
    const advances = await Advance.find()
      .populate('customerId', 'name mobile address')
      .sort({ createdAt: -1 });

    res.json(advances);
  } catch (error) {
    console.error('GET ADVANCES ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   GET ADVANCE DETAIL + LINKED SALES ✅ STEP-2.1
-------------------------------------------------- */
exports.getAdvanceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const advance = await Advance.findById(id)
      .populate('customerId', 'name mobile address')
      .populate({
        path: 'sales',
        options: { sort: { createdAt: -1 } },
      });

    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    res.json(advance);
  } catch (error) {
    console.error('GET ADVANCE DETAIL ERROR:', error);
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

    const sale = await Sale.create({
      customerId: advance.customerId,
      advanceId: advance._id,
      category: advance.category,
      rate: advance.rate,
      quantity: advance.remainingQuantity,
      total: advance.remainingQuantity * advance.rate,
      paid: advance.advance,
      due: advance.remaining,
    });

    advance.sales.push(sale._id);

    if (advance.remaining > 0) {
      let credit = await Credit.findOne({ customerId: advance.customerId });
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

    advance.deliveredQuantity = advance.quantity;
    advance.remainingQuantity = 0;
    advance.advance = 0;
    advance.remaining = 0;
    advance.status = 'delivered';
    await advance.save();

    res.json({ message: 'Advance fully delivered' });
  } catch (error) {
    console.error('CONVERT ADVANCE ERROR:', error);
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

    if (deliverQty <= 0 || deliverQty > advance.remainingQuantity) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const saleTotal = deliverQty * advance.rate;
    const paidFromAdvance = Math.min(advance.advance, saleTotal);
    const due = saleTotal - paidFromAdvance;

    const sale = await Sale.create({
      customerId: advance.customerId,
      advanceId: advance._id,
      category: advance.category,
      rate: advance.rate,
      quantity: deliverQty,
      total: saleTotal,
      paid: paidFromAdvance,
      due,
    });

    advance.sales.push(sale._id);

    advance.advance -= paidFromAdvance;
    advance.remaining -= paidFromAdvance;
    advance.remainingQuantity -= deliverQty;
    advance.deliveredQuantity += deliverQty;

    if (due > 0) {
      let credit = await Credit.findOne({ customerId: advance.customerId });
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

    advance.status =
      advance.remainingQuantity === 0 ? 'delivered' : 'partial';

    await advance.save();

    res.json({ message: 'Partial delivery recorded' });
  } catch (error) {
    console.error('PARTIAL DELIVERY ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
