// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { POINT_VALUE } = require('../helpers/cart');

const ALLOW_USER_CANCEL_STATUSES = ['pending', 'preparing'];

function hydrateAddress(address) {
  if (!address) return '—';
  return [address.number, address.street, address.district, address.city]
    .filter(Boolean)
    .join(', ');
}

function resolveCancelMessage(code) {
  switch (code) {
    case 'cancel-success':
      return { type: 'success', text: 'Đơn hàng đã được hủy thành công.' };
    case 'cancel-reason':
      return { type: 'error', text: 'Vui lòng nhập lý do hủy đơn.' };
    case 'cancel-not-allowed':
      return {
        type: 'error',
        text: 'Đơn hàng đã được xử lý, không thể hủy tại thời điểm này.',
      };
    case 'cancel-error':
      return { type: 'error', text: 'Không thể hủy đơn hàng. Vui lòng thử lại.' };
    default:
      return null;
  }
}

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const orderDocs = await Order.find({ userID: userId })
      .sort({ createdAt: -1 })
      .lean();

    const orders = orderDocs.map((order) => {
      let pointUsed = Number(order.pointUsed || 0);
      if (pointUsed > POINT_VALUE && pointUsed % POINT_VALUE === 0) {
        pointUsed = pointUsed / POINT_VALUE;
      }

      return {
        ...order,
        pointUsed,
        addressText: hydrateAddress(order.address),
        totalPrice: order.totalPrice || 0,
        pointsValue: pointUsed * POINT_VALUE,
        canCancel: ALLOW_USER_CANCEL_STATUSES.includes(order.status),
        items: (order.items || []).map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          subTotal:
            typeof item.subTotal === 'number'
              ? item.subTotal
              : (item.price || 0) * (item.quantity || 0),
        })),
      };
    });

    res.render('orders-my', {
      title: 'Đơn hàng của tôi',
      orders,
    });
  } catch (err) {
    console.error('Lỗi getMyOrders:', err);
    res.status(500).send('Lỗi khi tải đơn hàng của bạn 😢');
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.id;

    const orderDoc = await Order.findOne({
      _id: orderId,
      userID: userId,
    })
      .populate('items.productID', 'img name type')
      .lean();

    if (!orderDoc) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    const processedItems = (orderDoc.items || []).map((item) => {
      const image =
        item.productID?.img && item.productID.img.length
          ? item.productID.img[0]
          : '/images/default-plant.jpg';
      return {
        productName: item.productName || item.productID?.name,
        quantity: item.quantity,
        price: item.price,
        subTotal:
          typeof item.subTotal === 'number'
            ? item.subTotal
            : (item.price || 0) * (item.quantity || 0),
        variant: item.variant,
        type: item.productID?.type,
        image,
      };
    });

    const subtotal = processedItems.reduce(
      (sum, item) => sum + Number(item.subTotal || 0),
      0
    );
    let pointUsed = Number(orderDoc.pointUsed || 0);
    if (pointUsed > POINT_VALUE && pointUsed % POINT_VALUE === 0) {
      pointUsed = pointUsed / POINT_VALUE;
      orderDoc.pointUsed = pointUsed;
    }
    const pointsValue = pointUsed * POINT_VALUE;

    const order = {
      ...orderDoc,
      pointUsed,
      pointsValue,
      addressText: hydrateAddress(orderDoc.address),
      totalPrice: orderDoc.totalPrice || 0,
      items: processedItems,
      summary: {
        subtotal,
        shippingFee: orderDoc.shippingFee || 0,
        discount: orderDoc.discount || 0,
        pointsUsed: pointUsed,
        pointsValue,
        total: orderDoc.totalPrice || 0,
      },
      canCancel: ALLOW_USER_CANCEL_STATUSES.includes(orderDoc.status),
    };

    const message = resolveCancelMessage(req.query.msg);

    res.render('order-detail', {
      title: 'Chi tiết đơn hàng',
      order,
      message,
    });
  } catch (err) {
    console.error('Lỗi getOrderDetail:', err);
    res.status(500).send('Lỗi khi tải chi tiết đơn hàng 😢');
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.id;
    const reason = (req.body.reason || '').trim();

    if (!reason) {
      return res.redirect(`/orders/${orderId}?msg=cancel-reason`);
    }

    const order = await Order.findOne({ _id: orderId, userID: userId });
    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    if (!ALLOW_USER_CANCEL_STATUSES.includes(order.status)) {
      return res.redirect(`/orders/${orderId}?msg=cancel-not-allowed`);
    }

    await Promise.all(
      (order.items || []).map(async (item) => {
        const product = await Product.findById(item.productID);
        if (!product) return;
        product.inStock = Math.max(0, (product.inStock || 0) + item.quantity);
        product.soldCount = Math.max(
          0,
          (product.soldCount || 0) - item.quantity
        );
        await product.save();
      })
    );

    let pointsUsed = Number(order.pointUsed || 0);
    if (pointsUsed > POINT_VALUE && pointsUsed % POINT_VALUE === 0) {
      pointsUsed = pointsUsed / POINT_VALUE;
      order.pointUsed = pointsUsed;
    }
    if (pointsUsed > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { loyaltyPoint: pointsUsed } },
        { new: true }
      );
      if (updatedUser) {
        req.session.user.loyaltyPoint = updatedUser.loyaltyPoint;
      }
    }

    if (order.couponID) {
      const coupon = await Coupon.findById(order.couponID);
      if (coupon) {
        const newTimeUsed = Math.max((coupon.timeUsed || 0) - 1, 0);
        const update = { timeUsed: newTimeUsed };
        if (!coupon.maxUsage || newTimeUsed < coupon.maxUsage) {
          update.isActive = true;
        }
        await Coupon.findByIdAndUpdate(coupon._id, update);
      }
    }

    order.status = 'canceled';
    order.cancelReason = reason;
    order.canceledAt = new Date();
    order.pointRewarded = false;
    order.updateAt = new Date();
    await order.save();

    return res.redirect(`/orders/${orderId}?msg=cancel-success`);
  } catch (err) {
    console.error('Lỗi cancelOrder:', err);
    return res.redirect(`/orders/${req.params.id}?msg=cancel-error`);
  }
};
