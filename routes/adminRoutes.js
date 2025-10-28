const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

// GET /admin/products  → danh sách sản phẩm
router.get('/products', adminController.getAdminProductList);

// GET /admin/products/new  → form thêm sản phẩm
router.get('/products/new', adminController.getAddProductForm);

// POST /admin/products/new  → xử lý submit form + upload file
router.post(
  '/products/new',
  upload.single('photo'),
  adminController.postAddProduct
);

module.exports = router;
