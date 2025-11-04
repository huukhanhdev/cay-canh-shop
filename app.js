require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const Category = require('./models/Category');

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const adminRoutes = require('./routes/adminRoutes');        // <-- chỉ khai báo 1 lần
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const accountRoutes = require('./routes/accountRoutes');    // profile / account
const cartCount = require('./middleware/cartCount');
const categoriesToLocals = require('./middleware/categories');

const { isAuthenticated, isAdmin } = require('./middleware/auth');
const User = require('./models/User');

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://caycanh-mongo:27017/caycanhshop';

// ----- VIEW ENGINE -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- BODY PARSER -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- STATIC FILES -----
app.use(express.static(path.join(__dirname, 'public')));

// serve ảnh upload (public/uploads/xxx.jpg -> /uploads/xxx.jpg)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'public/uploads'))
);

// ----- SESSION -----
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'caycanh-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    },
  })
);

// ----- GẮN THÔNG TIN USER CHO VIEW (header dùng thông tin đăng nhập) -----
app.use(isAuthenticated);
app.use(categoriesToLocals);

// ----- CART COUNT + helper format tiền -----
app.use(cartCount);
app.use((req, res, next) => {
  res.locals.formatCurrency = (num) => {
    if (!num && num !== 0) return '';
    return Number(num).toLocaleString('vi-VN') + '₫';
  };
  next();
});

// =================== PUBLIC ROUTES ===================

// auth (login/register/logout)
app.use('/', authRoutes);

// account: hồ sơ cá nhân, đổi mật khẩu,...
app.use('/account', accountRoutes);

// trang chủ + chi tiết sản phẩm
app.use('/', productRoutes);

// giỏ hàng
app.use('/cart', cartRoutes);

// checkout
app.use('/checkout', checkoutRoutes);

// đơn hàng của tôi (customer)
app.use('/orders', orderRoutes);

// contact tĩnh
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Liên hệ' });
});

// =================== ADMIN ROUTES ===================
// ở đây MÌNH check isAdmin CHUNG 1 LẦN cho toàn bộ adminRoutes
app.use('/admin', isAdmin, adminRoutes);

// =================== 404 ===================
app.use((req, res) => {
  res.status(404).send('Không tìm thấy trang 😢');
});

// =================== DB CONNECT + SEED ADMIN ===================
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Đã kết nối MongoDB');

    // seed admin nếu chưa có
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      await User.create({
        name: 'Administrator',
        email: 'admin@caycanhshop.local',
        password: '123456',
        isAdmin: true,
      });
      console.log('✅ Admin mặc định: admin@caycanhshop.local / 123456');
    } else {
      console.log('ℹ️ Admin đã tồn tại');
    }

    // đảm bảo index phù hợp (chuyển từ username -> email)
    try {
      const indexes = await User.collection.indexes();
      const usernameIndex = indexes.find((idx) => idx.key && idx.key.username);
      if (usernameIndex) {
        await User.collection.dropIndex(usernameIndex.name);
        console.log('🔁 Đã xoá index cũ username_1 trên users.');
      }
    } catch (err) {
      console.warn('⚠️ Không thể xoá index username:', err.message);
    }
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
    } catch (err) {
      console.warn('⚠️ Không thể tạo index email:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🌿 Cây Cảnh Shop chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
  });
// sau khi connect DB
const seedIfEmpty = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.insertMany([
      { name: 'Cây để bàn', slug: 'cay-de-ban' },
      { name: 'Cây trong nhà', slug: 'cay-trong-nha' },
      { name: 'Cây phong thủy', slug: 'cay-phong-thuy' }
    ]);
    console.log('✅ Seed categories mặc định');
  }
};
seedIfEmpty();
app.use(async (req, res, next) => {
  try {
    const cats = await Category.find().sort({ name: 1 }).lean();
    res.locals.headerCategories = cats; // dùng riêng cho header
    next();
  } catch (e) {
    next(e);
  }
});
