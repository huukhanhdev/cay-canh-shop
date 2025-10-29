const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { requireLogin } = require('../middleware/auth');

// Xem giỏ hàng
router.get('/', requireLogin, cartController.getCartPage);

// Thêm sản phẩm vào giỏ
router.post('/add/:id', requireLogin, cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ
router.post('/update/:id', requireLogin, cartController.updateQty);

// Xóa 1 sản phẩm khỏi giỏ
router.post('/remove/:id', requireLogin, cartController.removeFromCart);

module.exports = router;
