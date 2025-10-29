require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const adminRoutes = require('./routes/adminRoutes');        // <-- chỉ khai báo 1 lần
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const accountRoutes = require('./routes/accountRoutes');    // profile / account
const cartCount = require('./middleware/cartCount');

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

// ----- GẮN THÔNG TIN USER CHO VIEW (header dùng isLoggedIn, role, username) -----
app.use(isAuthenticated);

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
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: '123456',
        role: 'admin',
        // các field khác tuỳ User schema sau này (email, fullName,...)
      });
      console.log('✅ Admin mặc định: admin / 123456');
    } else {
      console.log('ℹ️ Admin đã tồn tại');
    }

    app.listen(PORT, () => {
      console.log(`🌿 Cây Cảnh Shop chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
  });
