const Price = require('../models/Price');

// SET or UPDATE PRICE (OWNER)
exports.setPrice = async (req, res) => {
  try {
    const { category, rate } = req.body;

    if (!category || !rate) {
      return res.status(400).json({ message: 'Category and rate required' });
    }

    const price = await Price.findOneAndUpdate(
      { category },
      { rate, updatedBy: req.user.username },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Price updated successfully',
      price,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET CURRENT PRICES
exports.getPrices = async (req, res) => {
  try {
    const prices = await Price.find();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
