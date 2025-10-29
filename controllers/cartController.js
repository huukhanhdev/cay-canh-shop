const Product = require('../models/Product');

// đảm bảo session.cart tồn tại
function initCart(req) {
  if (!req.session) {
    req.session = {};
  }
  if (!req.session.cart) {
    req.session.cart = [];
  }
}

// GET /cart
exports.getCartPage = (req, res) => {
  initCart(req);

  const cartItems = req.session.cart;

  const total = cartItems.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  // render giỏ hàng
  res.render('cart', {
    title: 'Giỏ hàng của bạn',
    cartItems,
    total,
  });
};

// POST /cart/add/:id
exports.addToCart = async (req, res) => {
  initCart(req);

  const productId = req.params.id;

  // lấy sản phẩm trong DB
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).send('Không tìm thấy sản phẩm để thêm vào giỏ');
  }

  // tìm trong giỏ
  const existing = req.session.cart.find(
    (item) => item.productId === productId
  );

  if (existing) {
    existing.qty += 1;
  } else {
    req.session.cart.push({
      productId,
      name: product.name,
      price: product.price,
      img: product.img,
      qty: 1,
    });
  }

  res.redirect('/cart');
};

// POST /cart/update/:id
exports.updateQty = (req, res) => {
  initCart(req);

  const productId = req.params.id;
  const newQty = parseInt(req.body.qty, 10);

  const item = req.session.cart.find((i) => i.productId === productId);

  if (item) {
    if (isNaN(newQty) || newQty <= 0) {
      // nếu số lượng <= 0 thì xóa luôn khỏi giỏ
      req.session.cart = req.session.cart.filter(
        (i) => i.productId !== productId
      );
    } else {
      item.qty = newQty;
    }
  }

  res.redirect('/cart');
};

// POST /cart/remove/:id
exports.removeFromCart = (req, res) => {
  initCart(req);

  const productId = req.params.id;

  req.session.cart = req.session.cart.filter(
    (item) => item.productId !== productId
  );

  res.redirect('/cart');
};
