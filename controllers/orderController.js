// controllers/orderController.js
const Order = require('../models/Order');

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    // Render trang danh sách đơn của tôi
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

    const order = await Order.findOne({
      _id: orderId,
      userId: userId, // đảm bảo chỉ xem đơn của chính mình
    });

    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    res.render('order-detail', {
      title: 'Chi tiết đơn hàng',
      order,
    });
  } catch (err) {
    console.error('Lỗi getOrderDetail:', err);
    res.status(500).send('Lỗi khi tải chi tiết đơn hàng 😢');
  }
};
