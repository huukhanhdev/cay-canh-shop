const Cart = require('../models/Cart');

const POINT_VALUE = 1000;

function pickPrimaryImage(img) {
  if (Array.isArray(img) && img.length > 0) return img[0];
  if (typeof img === 'string' && img) return img;
  return '/images/default-plant.jpg';
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userID: userId, isActive: true });
  if (!cart) {
    cart = await Cart.create({
      userID: userId,
      items: [],
      totalPrice: 0,
      shippingFee: 0,
      discount: 0,
      pointUsed: 0,
    });
  }
  return cart;
}

function recalcTotals(cart) {
  const itemsSubtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.subTotal || 0),
    0
  );

  const shippingFee = Number(cart.shippingFee || 0);
  const discount = Math.min(Number(cart.discount || 0), itemsSubtotal);
  let pointsUsed = Math.max(Number(cart.pointUsed || 0), 0);
  if (pointsUsed > POINT_VALUE && pointsUsed % POINT_VALUE === 0) {
    pointsUsed = pointsUsed / POINT_VALUE;
    cart.pointUsed = pointsUsed;
  }
  const pointValue = Math.min(pointsUsed * POINT_VALUE, itemsSubtotal);

  cart.totalPrice = Math.max(
    0,
    itemsSubtotal + shippingFee - discount - pointValue
  );
}

function buildCartSummary(cart) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.subTotal || 0),
    0
  );
  let pointsUsed = Math.max(Number(cart.pointUsed || 0), 0);
  if (pointsUsed > POINT_VALUE && pointsUsed % POINT_VALUE === 0) {
    pointsUsed = pointsUsed / POINT_VALUE;
  }

  return {
    subtotal,
    shippingFee: cart.shippingFee || 0,
    discount: cart.discount || 0,
    pointsUsed,
    pointsValue: pointsUsed * POINT_VALUE,
    total: cart.totalPrice || 0,
  };
}

module.exports = {
  POINT_VALUE,
  pickPrimaryImage,
  getOrCreateCart,
  recalcTotals,
  buildCartSummary,
};
