const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Product = require('../models/Product');
const {
  POINT_VALUE,
  getOrCreateCart,
  recalcTotals,
  buildCartSummary,
} = require('../helpers/cart');

const DEFAULT_SHIPPING_FEE = 30000;

function parseCurrency(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

async function applyCoupon(couponCodeRaw, subtotal) {
  if (!couponCodeRaw) {
    return { coupon: null, discount: 0, error: null };
  }

  const couponCode = couponCodeRaw.trim().toUpperCase();
  if (!couponCode) {
    return { coupon: null, discount: 0, error: null };
  }

  const coupon = await Coupon.findOne({ code: couponCode }).lean();
  if (!coupon || coupon.isActive === false) {
    return { coupon: null, discount: 0, error: 'Mã giảm giá không hợp lệ.' };
  }
  if (coupon.maxUsage && coupon.timeUsed >= coupon.maxUsage) {
    return {
      coupon: null,
      discount: 0,
      error: 'Mã giảm giá đã hết lượt sử dụng.',
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * Number(coupon.discountValue || 0)) / 100;
  } else {
    discount = Number(coupon.discountValue || 0);
  }

  discount = Math.min(discount, subtotal);
  return { coupon, discount, error: null };
}

function calculatePointUsage(requestedPoints, availablePoints, subtotal) {
  if (!requestedPoints) {
    return { pointsUsed: 0, pointDiscount: 0, error: null };
  }

  const requested = Math.floor(Number(requestedPoints));
  if (!Number.isFinite(requested) || requested < 0) {
    return { pointsUsed: 0, pointDiscount: 0, error: 'Số điểm không hợp lệ.' };
  }

  if (requested > availablePoints) {
    return {
      pointsUsed: availablePoints,
      pointDiscount: availablePoints * POINT_VALUE,
      error: 'Bạn đã dùng tối đa số điểm hiện có.',
    };
  }

  const discount = Math.min(requested * POINT_VALUE, subtotal);
  return {
    pointsUsed: requested,
    pointDiscount: discount,
    error: null,
  };
}

exports.getCheckoutPage = async (req, res) => {
  const userId = req.session.user._id;
  const [cart, user] = await Promise.all([
    getOrCreateCart(userId),
    User.findById(userId).lean(),
  ]);

  if (!cart.items.length) {
    return res.redirect('/cart');
  }

  if (!cart.shippingFee) {
    cart.shippingFee = DEFAULT_SHIPPING_FEE;
  }

  recalcTotals(cart);
  await cart.save();

  let coupon = null;
  if (cart.couponID) {
    coupon = await Coupon.findById(cart.couponID).lean();
  }

  res.render('checkout', {
    cartItems: cart.items,
    summary: buildCartSummary(cart),
    shippingAddress: user?.shippingAddress || {},
    loyaltyPoint: user?.loyaltyPoint || 0,
    coupon,
    formData: {},
    errors: [],
  });
};

exports.postCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const [cart, user] = await Promise.all([
      getOrCreateCart(userId),
      User.findById(userId),
    ]);

    if (!cart.items.length) {
      return res.redirect('/cart');
    }

    const {
      number,
      street,
      district,
      city,
      couponCode,
      pointsToUse,
      shippingFee,
      note,
    } = req.body;

    cart.shippingFee = parseCurrency(shippingFee, DEFAULT_SHIPPING_FEE);

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.subTotal || 0),
      0
    );

    const messages = [];

    const { coupon, discount, error: couponError } = await applyCoupon(
      couponCode,
      subtotal
    );
    if (couponError) {
      messages.push(couponError);
    }

    const {
      pointsUsed,
      pointDiscount,
      error: pointError,
    } = calculatePointUsage(pointsToUse, user.loyaltyPoint || 0, subtotal);
    if (pointError) {
      messages.push(pointError);
    }

    cart.couponID = coupon ? coupon._id : null;
    cart.discount = discount;
    cart.pointUsed = pointsUsed;

    recalcTotals(cart);
    await cart.save();

    if (messages.length > 0) {
      return res.render('checkout', {
        cartItems: cart.items,
        summary: buildCartSummary(cart),
        shippingAddress: {
          number,
          street,
          district,
          city,
        },
        loyaltyPoint: user.loyaltyPoint || 0,
        coupon,
        errors: messages,
        formData: {
          couponCode,
          pointsToUse,
          shippingFee: cart.shippingFee,
          note,
        },
      });
    }

    const orderItems = cart.items.map((item) => ({
      productID: item.productID,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      subTotal:
        typeof item.subTotal === 'number'
          ? item.subTotal
          : item.price * item.quantity,
      variant: item.variant,
    }));

    const pointsEarned = Math.floor(cart.totalPrice / POINT_VALUE);

    const order = await Order.create({
      userID: userId,
      address: {
        number,
        street,
        district,
        city,
      },
      orderDate: new Date(),
      status: 'pending',
      updateAt: new Date(),
      items: orderItems,
      shippingFee: cart.shippingFee,
      couponID: coupon ? coupon._id : null,
      discount,
      pointUsed: pointsUsed,
      totalPrice: cart.totalPrice,
      pointEarned: pointsEarned,
      note: note || '',
    });

    // cập nhật tồn kho & lượng bán
    await Promise.all(
      cart.items.map(async (item) => {
        const productDoc = await Product.findById(item.productID);
        if (!productDoc) return;
        productDoc.soldCount = (productDoc.soldCount || 0) + item.quantity;
        const currentStock = Number(productDoc.inStock || 0);
        productDoc.inStock = Math.max(0, currentStock - item.quantity);
        await productDoc.save();
      })
    );

    // cập nhật người dùng
    const loyaltyAfterSpend = Math.max(
      0,
      (user.loyaltyPoint || 0) - pointsUsed
    );

    user.shippingAddress = {
      number,
      street,
      district,
      city,
      isDefault: true,
    };
    user.loyaltyPoint = loyaltyAfterSpend;
    await user.save();

    req.session.user.loyaltyPoint = loyaltyAfterSpend;
    req.session.user.name = user.name;
    req.session.user.email = user.email;

    if (coupon) {
      const updateCoupon = { $inc: { timeUsed: 1 } };
      if (
        coupon.maxUsage &&
        coupon.timeUsed + 1 >= coupon.maxUsage
      ) {
        updateCoupon.$set = { isActive: false };
      }
      await Coupon.findByIdAndUpdate(coupon._id, updateCoupon);
    }

    // reset cart
    cart.items = [];
    cart.couponID = null;
    cart.discount = 0;
    cart.pointUsed = 0;
    cart.shippingFee = DEFAULT_SHIPPING_FEE;
    cart.totalPrice = 0;
    await cart.save();

    res.render('checkout-success', {
      title: 'Đặt hàng thành công',
      orderId: order._id,
      summary: {
        subtotal,
        shippingFee: order.shippingFee,
        discount,
        pointsValue: pointsUsed * POINT_VALUE,
        total: order.totalPrice,
      },
      points: {
        used: pointsUsed,
        earned: pointsEarned,
      },
    });
  } catch (err) {
    console.error('Lỗi khi checkout:', err);
    res.status(500).send('Có lỗi khi đặt hàng.');
  }
};
