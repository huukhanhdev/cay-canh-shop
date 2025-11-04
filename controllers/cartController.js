const Product = require('../models/Product');
const {
  pickPrimaryImage,
  getOrCreateCart,
  recalcTotals,
  buildCartSummary,
} = require('../helpers/cart');

function resolveCartMessage(code) {
  switch (code) {
    case 'out-of-stock':
      return 'Sản phẩm hiện đã hết hàng.';
    case 'exceed-stock':
      return 'Bạn đã đặt số lượng tối đa còn lại của sản phẩm.';
    case 'limited-stock':
      return 'Số lượng yêu cầu vượt quá tồn kho, hệ thống đã điều chỉnh về mức tối đa.';
    default:
      return null;
  }
}

exports.getCartPage = async (req, res) => {
  const userId = req.session.user._id;
  const cart = await getOrCreateCart(userId);
  recalcTotals(cart);
  await cart.save();

  res.render('cart', {
    title: 'Giỏ hàng của bạn',
    cartItems: cart.items,
    cartSummary: buildCartSummary(cart),
    message: resolveCartMessage(req.query.msg),
  });
};

exports.addToCart = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.id;

  const product = await Product.findById(productId).lean();
  if (!product) {
    return res.status(404).send('Không tìm thấy sản phẩm để thêm vào giỏ');
  }

  const stock = Number(product.inStock || 0);
  if (stock <= 0) {
    return res.redirect('/cart?msg=out-of-stock');
  }

  const cart = await getOrCreateCart(userId);

  const existing = cart.items.find(
    (item) => String(item.productID) === String(productId)
  );

  if (existing) {
    if (existing.quantity >= stock) {
      return res.redirect('/cart?msg=exceed-stock');
    }
    existing.quantity += 1;
    existing.subTotal = existing.quantity * existing.price;
  } else {
    cart.items.push({
      productID: product._id,
      productName: product.name,
      productImg: pickPrimaryImage(product.img),
      type: product.type,
      price: product.price,
      quantity: 1,
      subTotal: product.price,
      variant: {},
    });
  }

  recalcTotals(cart);
  await cart.save();

  res.redirect('/cart');
};

exports.updateQty = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.id;
  const newQty = parseInt(req.body.qty, 10);

  const cart = await getOrCreateCart(userId);
  const item = cart.items.find(
    (i) => String(i.productID) === String(productId)
  );

  if (item) {
    const product = await Product.findById(productId).lean();
    const stockValue = product ? Number(product.inStock) : NaN;
    const stock = Number.isFinite(stockValue) ? stockValue : Infinity;
    if (!product) {
      cart.items = cart.items.filter(
        (i) => String(i.productID) !== String(productId)
      );
      await cart.save();
      return res.redirect('/cart');
    }

    if (stock <= 0) {
      cart.items = cart.items.filter(
        (i) => String(i.productID) !== String(productId)
      );
      await cart.save();
      return res.redirect('/cart?msg=out-of-stock');
    }

    if (!Number.isFinite(newQty) || newQty <= 0) {
      cart.items = cart.items.filter(
        (i) => String(i.productID) !== String(productId)
      );
    } else {
      if (newQty > stock) {
        item.quantity = stock;
        recalcTotals(cart);
        await cart.save();
        return res.redirect('/cart?msg=limited-stock');
      }
      item.quantity = newQty;
      item.subTotal = item.quantity * item.price;
    }
    recalcTotals(cart);
    await cart.save();
  }

  res.redirect('/cart');
};

exports.removeFromCart = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.id;

  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(
    (item) => String(item.productID) !== String(productId)
  );
  recalcTotals(cart);
  await cart.save();

  res.redirect('/cart');
};
