const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const PlantDetail = require('../models/PlantDetail');
const PotDetail = require('../models/PotDetail');
const User = require('../models/User');
const { POINT_VALUE } = require('../helpers/cart');

function toSlug(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function pickPrimaryImage(img) {
  if (Array.isArray(img) && img.length > 0) return img[0];
  if (typeof img === 'string' && img) return img;
  return '/images/default-plant.jpg';
}

// =================== SẢN PHẨM ===================

// GET /admin/products
exports.getProductsPage = async (req, res) => {
  try {
    const [products, cats] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).lean(),
      Category.find().lean(),
    ]);

    const catNameById = new Map(cats.map((c) => [String(c._id), c.name]));

    const viewData = products.map((p) => ({
      ...p,
      img: pickPrimaryImage(p.img),
      categoryName: p.categoryID
        ? catNameById.get(String(p.categoryID)) || '—'
        : '—',
    }));

    res.render('admin-products', { title: 'Quản lý sản phẩm', products: viewData });
  } catch (err) {
    console.error('Lỗi lấy danh sách sản phẩm:', err);
    res.status(500).send('Lỗi server khi lấy sản phẩm');
  }
};



// GET /admin/products/new
// GET /admin/products/new  -> nhớ truyền categories để render <select>

exports.getAddProductForm = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.render('admin-add-product', { title: 'Thêm sản phẩm mới', categories });
  } catch (err) {
    console.error('Lỗi mở form thêm sản phẩm:', err);
    res.status(500).send('Không mở được form thêm sản phẩm');
  }
};
// POST /admin/products/new
exports.postAddProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      price,
      description,
      type,
      categoryID,
      inStock,
      plantHeight,
      plantDifficulty,
      plantLight,
      plantWater,
      potMaterial,
      potPattern,
      potDimension,
      potColor,
    } = req.body;

    if (!categoryID) {
      return res.status(400).send('Danh mục bắt buộc');
    }

    const computedSlug = slug && slug.trim() ? slug.trim() : toSlug(name);
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : '/images/default-plant.jpg';

    const stock = Number(inStock);
    const product = await Product.create({
      name,
      slug: computedSlug,
      price: Number(price),
      description,
      type: type || '',
      categoryID,
      inStock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
      img: [imagePath],
    });

    const hasPlantDetail = [plantHeight, plantDifficulty, plantLight, plantWater].some(
      (val) => val && val.trim()
    );

    if (hasPlantDetail) {
      await PlantDetail.create({
        productID: product._id,
        height: plantHeight,
        difficulty: plantDifficulty,
        lightRequirement: plantLight,
        waterDemand: plantWater,
      });
    }

    const hasPotDetail = [potMaterial, potPattern, potDimension, potColor].some(
      (val) => val && val.trim()
    );

    if (hasPotDetail) {
      await PotDetail.create({
        productID: product._id,
        material: potMaterial,
        pattern: potPattern,
        dimension: potDimension,
        color: potColor,
      });
    }

    res.redirect('/admin/products');
  } catch (err) {
    console.error('❌ Lỗi khi thêm sản phẩm:', err);
    res.status(500).send('Không thể thêm sản phẩm');
  }
};
exports.getEditProductForm = async (req, res) => {
  try {
    const { id } = req.params;
    const [product, categories, plantDetail, potDetail] = await Promise.all([
      Product.findById(id).lean(),
      Category.find().sort({ name: 1 }).lean(),
      PlantDetail.findOne({ productID: id }).lean(),
      PotDetail.findOne({ productID: id }).lean(),
    ]);

    if (!product) return res.status(404).send('Không tìm thấy sản phẩm');
    const viewProduct = {
      ...product,
      img: pickPrimaryImage(product.img),
    };
    res.render('admin-edit-product', {
      title: 'Sửa sản phẩm',
      product: viewProduct,
      categories,
      plantDetail,
      potDetail,
    });
  } catch (err) {
    console.error('Lỗi mở form sửa sản phẩm:', err);
    res.status(500).send('Lỗi server khi mở form sửa sản phẩm');
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      price,
      description,
      type,
      categoryID,
      inStock,
      plantHeight,
      plantDifficulty,
      plantLight,
      plantWater,
      potMaterial,
      potPattern,
      potDimension,
      potColor,
    } = req.body;

    const update = {
      name,
      price: Number(price),
      description,
      type: type || '',
      categoryID,
      inStock: Number.isFinite(Number(inStock)) && Number(inStock) >= 0 ? Number(inStock) : 0,
    };

    if (!categoryID) {
      return res.status(400).send('Danh mục bắt buộc');
    }

    if (slug && slug.trim()) {
      update.slug = slug.trim();
    } else if (name) {
      update.slug = toSlug(name);
    }

    if (req.file) {
      update.img = [`/uploads/${req.file.filename}`];
    }

    await Product.findByIdAndUpdate(id, update);

    const hasPlantDetail = [plantHeight, plantDifficulty, plantLight, plantWater].some(
      (val) => val && val.trim()
    );
    if (hasPlantDetail) {
      await PlantDetail.findOneAndUpdate(
        { productID: id },
        {
          productID: id,
          height: plantHeight,
          difficulty: plantDifficulty,
          lightRequirement: plantLight,
          waterDemand: plantWater,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await PlantDetail.deleteOne({ productID: id });
    }

    const hasPotDetail = [potMaterial, potPattern, potDimension, potColor].some(
      (val) => val && val.trim()
    );
    if (hasPotDetail) {
      await PotDetail.findOneAndUpdate(
        { productID: id },
        {
          productID: id,
          material: potMaterial,
          pattern: potPattern,
          dimension: potDimension,
          color: potColor,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await PotDetail.deleteOne({ productID: id });
    }

    res.redirect('/admin/products');
  } catch (err) {
    console.error('Lỗi cập nhật sản phẩm:', err);
    res.status(500).send('Không thể cập nhật sản phẩm');
  }
};  
exports.postDeleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndDelete(productId);
    await Promise.all([
      PlantDetail.deleteOne({ productID: productId }),
      PotDetail.deleteOne({ productID: productId }),
    ]);
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Lỗi xoá sản phẩm:', err.message);
    res.status(500).send('Không thể xoá sản phẩm');
  }
};
// =================== ĐƠN HÀNG ===================

// GET /admin/orders
exports.getOrdersPage = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userID', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const viewOrders = orders.map((order) => {
      const addressParts = [
        order.address?.number,
        order.address?.street,
        order.address?.district,
        order.address?.city,
      ].filter(Boolean);

      return {
        ...order,
        customerName: order.userID?.name,
        customerEmail: order.userID?.email,
        addressText: addressParts.join(', '),
        totalPrice: order.totalPrice || 0,
      };
    });

    res.render('admin-orders', { orders: viewOrders });
  } catch (err) {
    console.error('Lỗi lấy danh sách đơn hàng:', err.message);
    res.status(500).send('Lỗi server khi lấy đơn hàng');
  }
};

// GET /admin/orders/:id
exports.getOrderDetailPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDoc = await Order.findById(orderId)
      .populate('userID', 'name email')
      .populate('items.productID', 'img name variants')
      .lean();

    if (!orderDoc) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    const addressParts = [
      orderDoc.address?.number,
      orderDoc.address?.street,
      orderDoc.address?.district,
      orderDoc.address?.city,
    ].filter(Boolean);

    const items = (orderDoc.items || []).map((item) => {
      const productImage =
        item.productID?.img && item.productID.img.length
          ? item.productID.img[0]
          : '/images/default-plant.jpg';

      return {
        ...item,
        productName: item.productName,
        quantity: item.quantity,
        variant: item.variant,
        subTotal: item.subTotal,
        type: item.productID?.type,
        image: productImage,
      };
    });

    let pointUsed = Number(orderDoc.pointUsed || 0);
    if (pointUsed > POINT_VALUE && pointUsed % POINT_VALUE === 0) {
      pointUsed = pointUsed / POINT_VALUE;
    }

    const order = {
      ...orderDoc,
      pointUsed,
      pointsValue: pointUsed * POINT_VALUE,
      customerName: orderDoc.userID?.name,
      customerEmail: orderDoc.userID?.email,
      addressText: addressParts.join(', '),
      items,
    };

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

    const validStatuses = ['pending', 'preparing', 'shipping', 'done', 'canceled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).send('Trạng thái không hợp lệ');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.updateAt = new Date();

    if (newStatus === 'done' && !order.pointRewarded && order.pointEarned) {
      const user = await User.findById(order.userID);
      if (user) {
        user.loyaltyPoint = Math.max(
          0,
          (user.loyaltyPoint || 0) + order.pointEarned
        );
        await user.save();
      }
      order.pointRewarded = true;
    } else if (
      previousStatus === 'done' &&
      newStatus !== 'done' &&
      order.pointRewarded &&
      order.pointEarned
    ) {
      const user = await User.findById(order.userID);
      if (user) {
        user.loyaltyPoint = Math.max(
          0,
          (user.loyaltyPoint || 0) - order.pointEarned
        );
        await user.save();
      }
      order.pointRewarded = false;
    }

    await order.save();

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
    const order = await Order.findById(orderId)
      .populate('userID', 'name email')
      .lean();

    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    let pointUsed = Number(order.pointUsed || 0);
    if (pointUsed > POINT_VALUE && pointUsed % POINT_VALUE === 0) {
      pointUsed = pointUsed / POINT_VALUE;
      order.pointUsed = pointUsed;
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
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send('Không tìm thấy đơn hàng');
    }

    const {
      addressNumber,
      street,
      district,
      city,
      shippingFee,
      status,
      discount,
      pointUsed,
      note,
    } = req.body;

    order.address = {
      number: addressNumber,
      street,
      district,
      city,
    };

    if (shippingFee !== undefined) {
      order.shippingFee = Number(shippingFee) || 0;
    }
    if (discount !== undefined) {
      order.discount = Number(discount) || 0;
    }
    if (pointUsed !== undefined) {
      let normalizedPoints = Number(pointUsed) || 0;
      if (normalizedPoints > POINT_VALUE && normalizedPoints % POINT_VALUE === 0) {
        normalizedPoints = normalizedPoints / POINT_VALUE;
      }
      order.pointUsed = normalizedPoints;
    }
    if (note !== undefined) {
      order.note = note;
    }

    const validStatuses = ['pending', 'preparing', 'shipping', 'done', 'canceled'];
    if (status && validStatuses.includes(status)) {
      const previousStatus = order.status;
      order.status = status;
      if (order.status === 'done' && !order.pointRewarded && order.pointEarned) {
        const user = await User.findById(order.userID);
        if (user) {
          user.loyaltyPoint = Math.max(
            0,
            (user.loyaltyPoint || 0) + order.pointEarned
          );
          await user.save();
        }
        order.pointRewarded = true;
      } else if (
        previousStatus === 'done' &&
        order.status !== 'done' &&
        order.pointRewarded &&
        order.pointEarned
      ) {
        const user = await User.findById(order.userID);
        if (user) {
          user.loyaltyPoint = Math.max(
            0,
            (user.loyaltyPoint || 0) - order.pointEarned
          );
          await user.save();
        }
        order.pointRewarded = false;
      }
    }

    order.updateAt = new Date();

    await order.save();

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
