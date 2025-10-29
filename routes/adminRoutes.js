const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const upload = require('../middleware/upload');
const { isAdmin } = require('../middleware/auth');

// DASHBOARD / BÁO CÁO
router.get('/dashboard', isAdmin, dashboardController.getDashboard);

// SẢN PHẨM
// Danh sách sản phẩm
router.get('/products', isAdmin, adminController.getProductsPage);

// Form thêm sản phẩm
router.get('/products/new', isAdmin, adminController.getAddProductForm);

// Submit thêm sản phẩm
router.post(
  '/products/new',
  upload.single('photo'),      // đổi từ 'img' -> 'photo'
  adminController.postAddProduct
);


// ĐƠN HÀNG
// Danh sách đơn hàng
router.get('/orders', isAdmin, adminController.getOrdersPage);

// Xem chi tiết 1 đơn
router.get('/orders/:id', isAdmin, adminController.getOrderDetailPage);

// Form sửa thông tin người nhận / địa chỉ / sđt
router.get('/orders/:id/edit', isAdmin, adminController.getEditOrderPage);

// Submit cập nhật thông tin người nhận
router.post('/orders/:id/update', isAdmin, adminController.updateOrderInfo);

// Cập nhật trạng thái đơn (pending → shipped → done → cancelled,...)
router.post('/orders/:id/status', isAdmin, adminController.updateOrderStatus);

// Xoá đơn
router.post('/orders/:id/delete', isAdmin, adminController.deleteOrder);

module.exports = router;
