const Product = require('../models/Product');

// Trang chủ
exports.getHomePage = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('home', { products });
  } catch (err) {
    console.error('Lỗi lấy sản phẩm:', err.message);
    res.status(500).send('Lỗi server khi lấy sản phẩm');
  }
};

// Chi tiết sản phẩm
exports.getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Không tìm thấy cây 🌵');
    }

    res.render('product-detail', { product });
  } catch (err) {
    console.error('Lỗi lấy chi tiết sản phẩm:', err.message);
    res.status(500).send('Lỗi server khi lấy chi tiết sản phẩm');
  }
};
