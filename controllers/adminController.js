const Product = require('../models/Product');
const Order = require('../models/Order');

// =================== SẢN PHẨM ===================

// GET /admin/products
exports.getProductsPage = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin-products', { products });
  } catch (err) {
    console.error('Lỗi lấy danh sách sản phẩm:', err.message);
    res.status(500).send('Lỗi server khi lấy sản phẩm');
  }
};

// GET /admin/products/new
exports.getAddProductForm = (req, res) => {
  res.render('admin-add-product', { title: 'Thêm sản phẩm mới' });
};

// POST /admin/products
exports.postAddProduct = async (req, res) => {
  try {
    const { name, price, desc } = req.body;

    const newProduct = new Product({
      name,
      price,
      desc,
      img: req.file
        ? `/uploads/${req.file.filename}`
        : '/images/default-plant.jpg',
    });

    await newProduct.save();
    return res.redirect('/admin/products');
  } catch (err) {
    console.error('❌ Lỗi khi thêm sản phẩm:', err);
    return res.status(500).render('admin-add-product', {
      title: 'Thêm sản phẩm mới',
      error: 'Không thể thêm sản phẩm. Vui lòng kiểm tra dữ liệu.'
    });
  }
};


// =================== ĐƠN HÀNG ===================

// GET /admin/orders
exports.getOrdersPage = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('admin-orders', { orders });
  } catch (err) {
    console.error('Lỗi lấy danh sách đơn hàng:', err.message);
    res.status(500).send('Lỗi server khi lấy đơn hàng');
  }
};

// GET /admin/orders/:id
exports.getOrderDetailPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    res.render('admin-order-detail', { order });
  } catch (err) {
    console.error('Lỗi lấy chi tiết đơn hàng:', err.message);
    res.status(500).send('Lỗi server khi lấy chi tiết đơn hàng');
  }
};

// POST /admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'done'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send('Trạng thái không hợp lệ');
    }

    await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái đơn:', err.message);
    res.status(500).send('Lỗi server khi cập nhật trạng thái');
  }
};
// =================== CẬP NHẬT TRẠNG THÁI ĐƠN ===================

// POST /admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const newStatus = req.body.status;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'done', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send('Trạng thái không hợp lệ');
    }

    await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái đơn:', err.message);
    res.status(500).send('Lỗi server khi cập nhật trạng thái');
  }
};

// =================== CẬP NHẬT THÔNG TIN KHÁCH ===================

// POST /admin/orders/:id/update
// GET /admin/orders/:id/edit
exports.getEditOrderPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    res.render('admin-order-edit', { order });
  } catch (err) {
    console.error('Lỗi mở form edit đơn:', err.message);
    res.status(500).send('Lỗi server khi mở form chỉnh sửa đơn');
  }
};

// POST /admin/orders/:id/update
exports.updateOrderInfo = async (req, res) => {
  try {
    const orderId = req.params.id;

    // chú ý: ở model Order hiện tại anh có thể đang dùng
    // customerName, phone, address
    // nếu đúng vậy thì mình map từ form cho khớp
    const { customerName, phone, address } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      customerName,
      phone,
      address,
    });

    res.redirect(`/admin/orders/${orderId}`);
  } catch (err) {
    console.error('Lỗi cập nhật thông tin đơn:', err.message);
    res.status(500).send('Lỗi server khi cập nhật thông tin');
  }
};


// =================== XOÁ ĐƠN HÀNG ===================

// POST /admin/orders/:id/delete
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    await Order.findByIdAndDelete(orderId);
    res.redirect('/admin/orders');
  } catch (err) {
    console.error('Lỗi xoá đơn:', err.message);
    res.status(500).send('Không thể xoá đơn hàng');
  }
};
