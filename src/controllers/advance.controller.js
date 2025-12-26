const Advance = require('../models/Advance');
const Price = require('../models/Price');
const Sale = require('../models/Sale');
const Credit = require('../models/Credit');

/* --------------------------------------------------
   PARTIAL DELIVERY (OWNER) - FIXED MATH
-------------------------------------------------- */
exports.partialDeliver = async (req, res) => {
  try {
    const { id } = req.params;
    // Note: frontend sends 'quantity', backend receives it as 'deliverQty' based on your variable usage
    // Check your router to confirm if you map req.body.quantity to deliverQty
    // Assuming req.body contains { quantity, transport, driver } based on Flutter code
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
    // We pay as much as possible from the advance wallet
    const paidFromAdvance = Math.min(advance.advance, saleTotal);
    
    // 3. Calculate Due for THIS Truck
    // If wallet had 10k, and bill is 24k -> Due is 14k.
    // If wallet had 30k, and bill is 24k -> Due is 0.
    const currentTruckDue = saleTotal - paidFromAdvance;

    // 4. Create Sale Record (The Receipt)
    const sale = await Sale.create({
      customerId: advance.customerId,
      advanceId: advance._id,
      category: advance.category,
      rate: advance.rate,
      quantity: deliverQty,
      total: saleTotal,
      paid: paidFromAdvance, // This records that 10k was adjusted
      due: currentTruckDue,  // This records 14k is still needed for this truck
      transport: transport || null,
      driver: driver || null,
    });

    // 5. Link Sale to Advance
    advance.sales.push(sale._id);

    // 6. UPDATE ADVANCE STATE
    // Decrease the "Wallet" because we used the money.
    advance.advance -= paidFromAdvance; 
    
    // Decrease Stock because we delivered it.
    advance.remainingQuantity -= deliverQty;
    advance.deliveredQuantity += deliverQty;

    // 🔥 CRITICAL FIX: DO NOT SUBTRACT 'paidFromAdvance' FROM 'advance.remaining'
    // 'advance.remaining' tracks the Total Outstanding Debt for the whole 60k order.
    // That debt was calculated at the start (60k - 10k = 50k).
    // Delivering bricks doesn't change the fact that he owes 50k cash.
    // The only thing that reduces 'advance.remaining' is NEW CASH PAYMENT (not delivery).
    
    // However, if this delivery generated *NEW* Due (currentTruckDue > 0),
    // does it add to global credit?
    // Case 1: Order 60k, Adv 10k. Due 50k.
    // Delivery 1: 24k bill. Uses 10k Adv. Truck Due 14k.
    // The customer owes 50k total. 
    // This 14k is PART of that 50k. We don't add it to Credit again if Credit matches Advance.remaining.
    
    // Logic: We usually sync the Credit Ledger with the Advance 'remaining'.
    // If your system pushes to Credit Ledger on every Sale, then:
    // We need to ensure we don't double count.
    
    // For now, let's stick to your existing flow:
    // You push 'due' to Credit model.
    if (currentTruckDue > 0) {
       // Wait! If 'advance.remaining' already holds the 50k debt,
       // and we add 14k to Credit here, we might be duplicating if Credit was initialized with 50k.
       // CHECK: Did createAdvance add 50k to Credit? 
       // Your createAdvance code DOES NOT add to Credit model.
       // So yes, we MUST add this truck's due to Credit now.
       
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