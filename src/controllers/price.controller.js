const Price = require('../models/Price');

/**
 * Default categories (ONE-TIME AUTO SEED)
 * These will be created automatically on first API hit
 */
const DEFAULT_CATEGORIES = [
  'Category 1',
  'Category 2',
  'Category 3',
  'Rath',
  'Goriya',
  'Tukra 1',
  'Tukra 2',
];


/**
 * SET or UPDATE PRICE (OWNER / ADMIN)
 */
exports.setPrice = async (req, res) => {
  try {
    const { category, rate } = req.body;

    if (!category || rate === undefined) {
      return res
        .status(400)
        .json({ message: 'Category and rate are required' });
    }

    const price = await Price.findOneAndUpdate(
      { category },
      {
        rate,
        updatedBy: req.user?.username || 'system',
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Price updated successfully',
      price,
    });
  } catch (error) {
    console.error('Set price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET CURRENT PRICES (AUTO-SEED DEFAULT CATEGORIES)
 * Used by Flutter Sales screen
 */
exports.getPrices = async (req, res) => {
  try {
    let prices = await Price.find();

    // 🔥 AUTO-SEED ONLY IF EMPTY (ONE TIME)
    if (prices.length === 0) {
      await Price.insertMany(
        DEFAULT_CATEGORIES.map((category) => ({
          category,
          rate: 0,
          updatedBy: 'system',
        }))
      );

      prices = await Price.find();
    }

    // 🎯 Flutter-friendly response
    const result = {};
    prices.forEach((p) => {
      result[p.category] = p.rate;
    });

    res.json(result);
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
