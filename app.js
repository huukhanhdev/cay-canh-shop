require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

const { exposeUser } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// parser & static
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));
// 
app.use((req, res, next) => {
  res.locals.msg = req.query.msg || null;
  res.locals.error = null;
  res.locals.info = null;
  next();
});

app.use('/auth', require('./routes/authRoutes'));

// gắn biến cho header
app.use(exposeUser);

// routes
app.use('/', authRoutes);

// trang chủ tạm
app.get('/', (req, res) => res.render('auth-login', { title: 'Đăng nhập' }));

// connect DB & start
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/caycanhshop')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
  })
  .catch(err => console.error('Mongo error:', err.message));
