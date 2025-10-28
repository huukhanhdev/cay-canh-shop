require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const cartCount = require('./middleware/cartCount');
const checkoutRoutes = require('./routes/checkoutRoutes');

const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'caycanh-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    }
  })
);
app.use(cartCount);


// routes
app.use('/', productRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);

// 404
app.use((req, res) => {
  res.status(404).send('Không tìm thấy trang 😢');
});

// 1. Luôn start server (để mình thấy web sống, tránh "đứng im")
app.listen(PORT, () => {
  console.log(`🌿 Cây Cảnh Shop đang chạy tại http://localhost:${PORT}`);
});

// 2. Kết nối MongoDB (log trạng thái)
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB');
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err.message);
  });
