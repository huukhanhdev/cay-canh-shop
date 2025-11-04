const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const categoryAdminController = require('../controllers/categoryAdminController');

const upload = require('../middleware/upload');
const { isAdmin } = require('../middleware/auth');

// DASHBOARD / BÁO CÁO
router.get('/dashboard', isAdmin, dashboardController.getDashboard);

// SẢN PHẨM
router.get('/products', isAdmin, adminController.getProductsPage);
router.get('/products/new', isAdmin, adminController.getAddProductForm);
router.post('/products/new', isAdmin, upload.single('img'), adminController.postAddProduct);
router.get('/products/:id/edit', isAdmin, adminController.getEditProductForm);
router.post('/products/:id/edit', isAdmin, upload.single('img'), adminController.postEditProduct);
router.post('/products/:id/delete', isAdmin, adminController.postDeleteProduct);

// ĐƠN HÀNG
router.get('/orders', isAdmin, adminController.getOrdersPage);
router.get('/orders/:id', isAdmin, adminController.getOrderDetailPage);
router.get('/orders/:id/edit', isAdmin, adminController.getEditOrderPage);
router.post('/orders/:id/update', isAdmin, adminController.updateOrderInfo);
router.post('/orders/:id/status', isAdmin, adminController.updateOrderStatus);
router.post('/orders/:id/delete', isAdmin, adminController.deleteOrder);

// DANH MỤC
router.get('/categories', isAdmin, categoryAdminController.listCategories);
router.get('/categories/new', isAdmin, categoryAdminController.getNewCategory);
router.post('/categories/new', isAdmin, categoryAdminController.postNewCategory);
router.get('/categories/:id/edit', isAdmin, categoryAdminController.getEditCategory);
router.post('/categories/:id/edit', isAdmin, categoryAdminController.postEditCategory);
router.post('/categories/:id/delete', isAdmin, categoryAdminController.deleteCategory);

module.exports = router;
