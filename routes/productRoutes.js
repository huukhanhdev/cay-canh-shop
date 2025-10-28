const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');

// Trang chủ
router.get('/', productController.getHomePage);

// Trang chi tiết sản phẩm /product/:id
router.get('/product/:id', productController.getProductDetail);

module.exports = router;
