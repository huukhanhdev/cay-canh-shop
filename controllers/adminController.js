const Product = require('../models/Product');

// GET /admin/products
exports.getAdminProductList = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin-products', { products });
  } catch (err) {
    console.error('Lỗi admin list:', err);
    res.status(500).send('Không load được danh sách sản phẩm');
  }
};

// GET /admin/products/new
exports.getAddProductForm = (req, res) => {
  res.render('admin-add-product');
};

// POST /admin/products/new
exports.postAddProduct = async (req, res) => {
  try {
    console.log('--- POST /admin/products/new ---');
    console.log('body:', req.body);
    console.log('file:', req.file);

    const { name, price, desc } = req.body;

    let imgPath = '/images/default-plant.jpg';
    if (req.file) {
      imgPath = '/uploads/' + req.file.filename;
    }

    const created = await Product.create({
      name,
      price,
      desc,
      img: imgPath
    });

    console.log('created product:', created);

    res.redirect('/admin/products');
  } catch (err) {
    console.error('Lỗi thêm sản phẩm:', err);
    res.status(500).send('Không thêm được sản phẩm mới');
  }
};
