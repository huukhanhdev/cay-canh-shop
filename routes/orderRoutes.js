// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { requireLogin } = require('../middleware/auth');

// Danh sách đơn của user đang đăng nhập
router.get('/my', requireLogin, orderController.getMyOrders);

// Xem chi tiết 1 đơn (chỉ nếu đơn đó thuộc user)
router.get('/:id', requireLogin, orderController.getOrderDetail);

// Hủy đơn hàng
router.post('/:id/cancel', requireLogin, orderController.cancelOrder);

module.exports = router;
