const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// Xem giỏ
router.get('/', cartController.getCartPage);

// thêm sản phẩm vào giỏ
router.post('/add/:id', cartController.addToCart);

// fallback GET để dev/test
router.get('/add/:id', cartController.addToCart);

// cập nhật số lượng
router.post('/update/:id', cartController.updateQty);

// xóa khỏi giỏ
router.post('/remove/:id', cartController.removeFromCart);

module.exports = router;
