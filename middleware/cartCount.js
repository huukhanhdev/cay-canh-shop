module.exports = function cartCount(req, res, next) {
  if (req.session && req.session.cart) {
    res.locals.cartCount = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
  } else {
    res.locals.cartCount = 0;
  }
  next();
};
