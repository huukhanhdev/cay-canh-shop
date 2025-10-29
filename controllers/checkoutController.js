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
    // Lấy thông tin form giao hàng từ req.body
    const { customerName, phone, address, note } = req.body;

    // Lấy giỏ hàng từ session
    const cart = req.session.cart || [];
    if (!cart.length) {
      return res.redirect('/cart');
    }

    // Tính tổng tiền
    const total = cart.reduce((sum, item) => {
      return sum + item.price * item.qty;
    }, 0);

    // Tạo order mới
    const newOrder = new Order({
      userId: req.session.userId || null, // nếu user chưa login thì vẫn cho null (tùy luật shop)
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      total,
      customerName,
      phone,
      address,
      note,
      status: 'pending',       // trạng thái mặc định
      createdAt: new Date()
    });

    await newOrder.save();

    // Clear giỏ sau khi đặt
    req.session.cart = [];

    // ⚠️ Quan trọng: TRUYỀN orderId vào view
    res.render('checkout-success', {
      title: 'Đặt hàng thành công',
      orderId: newOrder._id
    });

  } catch (err) {
    console.error('Lỗi khi checkout:', err);
    res.status(500).send('Có lỗi khi đặt hàng.');
  }
};
