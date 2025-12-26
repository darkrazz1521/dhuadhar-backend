const Advance = require('../models/Advance');
const Price = require('../models/Price');
const Sale = require('../models/Sale');
const Credit = require('../models/Credit');

/* --------------------------------------------------
   1. CREATE ADVANCE ORDER
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
    
    // Initial Debt Calculation
    const remaining = Math.max(total - advance, 0);

    const order = await Advance.create({
      customerId,
      category,
      rate,
      quantity,
      remainingQuantity: quantity,
      deliveredQuantity: 0,
      total,
      advance, // Wallet Balance
      remaining, // Total Pending Debt
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
   2. GET ALL ADVANCE ORDERS (DEAL SPECIFIC DUE)
   Fetches advances and calculates due based on LINKED SALES only.
-------------------------------------------------- */
exports.getAdvances = async (req, res) => {
  try {
    const advances = await Advance.find()
      .populate('customerId', 'name mobile address')
      // 🔥 MAGIC: Hamein sirf sales ka 'due' field chahiye calculation ke liye
      .populate({
        path: 'sales',
        select: 'due' 
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = advances.map(adv => {
      // 🧮 Calculate Deal Specific Due
      let dealSpecificDue = 0;

      if (adv.sales && adv.sales.length > 0) {
        // Is deal ki saari sales ka due jodo
        dealSpecificDue = adv.sales.reduce((sum, sale) => sum + (sale.due || 0), 0);
      }

      return {
        ...adv,
        currentDue: dealSpecificDue // ✅ Ye ab Global nahi, Deal Specific hai
      };
    });

    res.json(data);
  } catch (error) {
    console.error('GET ADVANCES ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* --------------------------------------------------
   3. GET ADVANCE DETAIL
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
   4. FULL DELIVERY / CLOSE ORDER (OWNER)
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

    const { transport, driver } = req.body;

    // Create Final Sale
    const sale = await Sale.create({
      customerId: advance.customerId,
      advanceId: advance._id,
      category: advance.category,
      rate: advance.rate,
      quantity: advance.remainingQuantity,
      total: advance.remainingQuantity * advance.rate,
      paid: advance.advance, // Use remaining wallet balance
      due: advance.remaining, // Use remaining debt calculation
      transport: transport || null,
      driver: driver || null,
    });

    advance.sales.push(sale._id);

    // Add to Global Credit Ledger if there is remaining debt
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

    // Close the Advance
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
   5. PARTIAL DELIVERY (FIXED MATH)
-------------------------------------------------- */
exports.partialDeliver = async (req, res) => {
  try {
    const { id } = req.params;
    // Map request body
    const { quantity, transport, driver } = req.body; 
    
    const deliverQty = parseInt(quantity); 

    const advance = await Advance.findById(id);
    if (!advance) {
      return res.status(404).json({ message: 'Advance not found' });
    }

    if (deliverQty <= 0 || deliverQty > advance.remainingQuantity) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // 1. Calculate Bill for THIS Truck
    const saleTotal = deliverQty * advance.rate;

    // 2. Use Available Advance Balance (Wallet)
    const paidFromAdvance = Math.min(advance.advance, saleTotal);
    
    // 3. Calculate Due for THIS Truck
    const currentTruckDue = saleTotal - paidFromAdvance;

    // 4. Create Sale Record (The Receipt)
    const sale = await Sale.create({
      customerId: advance.customerId,
      advanceId: advance._id,
      category: advance.category,
      rate: advance.rate,
      quantity: deliverQty,
      total: saleTotal,
      paid: paidFromAdvance, 
      due: currentTruckDue, 
      transport: transport || null,
      driver: driver || null,
    });

    // 5. Link Sale to Advance
    advance.sales.push(sale._id);

    // 6. UPDATE ADVANCE STATE
    advance.advance -= paidFromAdvance; // Reduce wallet
    advance.remainingQuantity -= deliverQty; // Reduce Stock
    advance.deliveredQuantity += deliverQty; // Increase Delivered

    // Note: We DO NOT reduce 'advance.remaining' (Total Debt) here.
    // The debt was fixed at the start. It only reduces when Customer pays CASH later.

    // 7. Add Truck Due to Global Credit Ledger
    if (currentTruckDue > 0) {
       let credit = await Credit.findOne({ customerId: advance.customerId });
       if (!credit) {
        credit = await Credit.create({
          customerId: advance.customerId,
          totalDue: currentTruckDue,
        });
       } else {
        credit.totalDue += currentTruckDue;
        await credit.save();
       }
    }

    // Update Status
    advance.status = advance.remainingQuantity === 0 ? 'delivered' : 'partial';

    await advance.save();

    res.json({ message: 'Partial delivery recorded', sale });
  } catch (error) {
    console.error('PARTIAL DELIVERY ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};