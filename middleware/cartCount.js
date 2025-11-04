const Cart = require('../models/Cart');

module.exports = async function cartCount(req, res, next) {
  try {
    if (req.session && req.session.user) {
      const cart = await Cart.findOne({
        userID: req.session.user._id,
        isActive: true,
      })
        .select('items.quantity')
        .lean();

      res.locals.cartCount = cart
        ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
    } else {
      res.locals.cartCount = 0;
    }
  } catch (err) {
    res.locals.cartCount = 0;
  }
  next();
};
