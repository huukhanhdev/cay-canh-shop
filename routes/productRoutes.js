// routes/productRoutes.js
const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { requireLogin } = require('../middleware/auth');

/**
 * Inject categories for header on all public pages
 * (để header hiển thị dropdown/link danh mục)
 */
router.use(async (req, res, next) => {
  try {
    const cats = await Category.find().sort({ name: 1 }).lean();
    res.locals.categories = cats; // header.ejs sẽ đọc biến này
  } catch (e) {
    res.locals.categories = [];
  }
  next();
});

/**
 * Trang chủ
 */
router.get('/', productController.getHomePage);
router.get('/products', productController.getProductListFiltered);   // <-- mới

/**
 * Danh sách theo danh mục: /category/:slug
 * Controller TUYỆT ĐỐI phải query theo { categoryID: cat._id }
 * và render ra views/product-list.ejs
 */
router.get('/category/:slug', productController.getByCategory);

/**
 * Chi tiết sản phẩm
 */
router.get('/product/:id', productController.getProductDetail);
router.post(
  '/product/:id/review',
  requireLogin,
  reviewController.createOrUpdateReview
);

module.exports = router;
