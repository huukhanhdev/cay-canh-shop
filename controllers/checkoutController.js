const Order = require('../models/Order');

function cartSnapshot(sessionCart) {
  const items = sessionCart.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    qty: item.qty,
    img: item.img
  }));

  const total = sessionCart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return { items, total };
}

exports.getCheckoutPage = (req, res) => {
  // nếu giỏ rỗng -> quay về /cart
  if (!req.session || !req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/cart');
  }

  const { items, total } = cartSnapshot(req.session.cart);

  res.render('checkout', { items, total });
};

exports.postCheckout = async (req, res) => {
  try {
    if (!req.session || !req.session.cart || req.session.cart.length === 0) {
      return res.redirect('/cart');
    }

    const { customerName, phone, address } = req.body;
    const { items, total } = cartSnapshot(req.session.cart);

    // tạo đơn hàng
    const order = await Order.create({
      customerName,
      phone,
      address,
      items,
      total,
      status: 'pending'
    });

    console.log('📦 New order:', order._id);

    // clear giỏ sau khi đặt
    req.session.cart = [];

    // chuyển tới trang cảm ơn
    res.render('checkout-success', { orderId: order._id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).send('Có lỗi khi tạo đơn hàng');
  }
};
