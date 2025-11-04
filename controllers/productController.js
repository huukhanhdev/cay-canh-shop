// controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const PlantDetail = require('../models/PlantDetail');
const PotDetail = require('../models/PotDetail');

/* ================= Helpers ================= */
function resolveReviewMessage(code) {
  switch (code) {
    case 'review-saved':
      return { type: 'success', text: 'Cảm ơn bạn! Đánh giá đã được lưu.' };
    case 'invalid-rating':
      return { type: 'error', text: 'Số sao không hợp lệ.' };
    case 'not-allowed':
      return {
        type: 'error',
        text: 'Chỉ khách đã mua sản phẩm mới có thể đánh giá.',
      };
    case 'review-error':
      return { type: 'error', text: 'Đã có lỗi khi lưu đánh giá. Vui lòng thử lại.' };
    case 'exceed-stock':
      return { type: 'error', text: 'Sản phẩm hiện chưa thể đánh giá.' };
    default:
      return null;
  }
}

function buildFilterFromQuery(query) {
  const { q, minPrice, maxPrice, category, inStock } = query || {};
  const filter = {};

  if (q && q.trim()) {
    filter.name = { $regex: q.trim(), $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // map query.category (_id string) -> categoryID (ObjectId)
  if (category && category !== 'all' && mongoose.Types.ObjectId.isValid(category)) {
    filter.categoryID = new mongoose.Types.ObjectId(category);
  }

  if (inStock === '1') {
    filter.inStock = { $gt: 0 };
  }

  return filter;
}

function buildSort(sortKey) {
  if (sortKey === 'priceAsc') return { price: 1 };
  if (sortKey === 'priceDesc') return { price: -1 };
  return { createdAt: -1 }; // default: newest
}

function formatProductForView(doc) {
  if (!doc) return doc;
  const product = { ...doc };
  const images = Array.isArray(product.img) ? product.img : [];
  product.img = images.length > 0 ? images[0] : '/images/default-plant.jpg';
  product.description = product.description || '';
  product.avgRating = Number(product.avgRating || 0);
  product.soldCount = Number(product.soldCount || 0);
  return product;
}

/* ================ Trang chủ ================ */
exports.getHomePage = async (req, res) => {
  const [productsRaw, categories] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).limit(12).lean(),
    Category.find().sort({ name: 1 }).lean(),
  ]);

  const products = productsRaw.map(formatProductForView);

  res.render('home', {
    title: 'Cây Cảnh Shop',
    products,
    categories,          // để header/form có thể dùng nếu cần
    currentCategory: null,
    query: {},           // để product-list/home dùng chung key nếu cần
  });
};

/* ============ Chi tiết sản phẩm ============ */
exports.getProductDetail = async (req, res) => {
  const productId = req.params.id;
  const [productDoc, categories, reviewsRaw, plantDetail, potDetail] =
    await Promise.all([
      Product.findById(productId).lean(),
      Category.find().sort({ name: 1 }).lean(),
      Review.find({ productID: productId })
        .populate('userID', 'name')
        .sort({ createdAt: -1 })
        .lean(),
      PlantDetail.findOne({ productID: productId }).lean(),
      PotDetail.findOne({ productID: productId }).lean(),
    ]);
  if (!productDoc) return res.status(404).send('Không tìm thấy sản phẩm');

  const product = formatProductForView(productDoc);
  const ratings = reviewsRaw.map((r) => Number(r.rating || 0));
  const avgFromReviews =
    ratings.length > 0
      ? Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
      : product.avgRating;

  const reviews = reviewsRaw.map((review) => ({
    ...review,
    userName: review.userID?.name || 'Ẩn danh',
  }));

  const reviewMessage = resolveReviewMessage(req.query.msg);

  res.render('product-detail', {
    title: product.name,
    product,
    avgRating: avgFromReviews,
    reviewCount: reviews.length,
    reviews,
    plantDetail,
    potDetail,
    categories,
    currentCategory: null,
    query: {},
    canReview: Boolean(req.session?.user),
    reviewMessage,
  });
};

/* ============== Danh sách /products (lọc) ============== */
exports.getProductListFiltered = async (req, res) => {
  const query = req.query || {};
  const filter = buildFilterFromQuery(query);
  const sort = buildSort(query.sort);

  const [productsRaw, categories] = await Promise.all([
    Product.find(filter).sort(sort).lean(),
    Category.find().sort({ name: 1 }).lean(),
  ]);

  const products = productsRaw.map(formatProductForView);

  res.render('product-list', {
    title: 'Sản phẩm',
    products,
    categories,
    currentCategory: null,
    query, // để giữ trạng thái form (q, category, minPrice, ...)
  });
};

/* ============== /category/:slug (lọc theo slug + các tham số khác) ============== */
exports.getByCategory = async (req, res) => {
  const query = req.query || {};
  const currentCategory = await Category.findOne({ slug: req.params.slug }).lean();
  if (!currentCategory) return res.status(404).send('Không tìm thấy danh mục');

  // build từ query, rồi ép categoryID theo slug (slug ưu tiên hơn query.category)
  const filter = buildFilterFromQuery(query);
  filter.categoryID = currentCategory._id;

  const sort = buildSort(query.sort);

  const [productsRaw, categories] = await Promise.all([
    Product.find(filter).sort(sort).lean(),
    Category.find().sort({ name: 1 }).lean(),
  ]);

  const products = productsRaw.map(formatProductForView);

  res.render('product-list', {
    title: `Danh mục: ${currentCategory.name}`,
    products,
    categories,
    currentCategory,
    query, // để form giữ giá trị khi lọc trong category
  });
};
