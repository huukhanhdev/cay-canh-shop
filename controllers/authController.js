const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  const { msg } = req.query;
  res.render('login', {
    title: 'Đăng nhập',
    message: null,
    msg,
  });
};

exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. tìm user theo username
    const user = await User.findOne({ username });

    if (!user) {
      return res.render('login', {
        title: 'Đăng nhập',
        message: 'Sai tài khoản hoặc mật khẩu',
        msg: null,
      });
    }

    // 2. so sánh password người dùng nhập với hash trong DB
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', {
        title: 'Đăng nhập',
        message: 'Sai tài khoản hoặc mật khẩu',
        msg: null,
      });
    }

    // 3. Lưu user vào session
    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
    };

    // 4. Save session rồi redirect đúng role
    req.session.save(() => {
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/');
      }
    });
  } catch (err) {
    console.error('❌ Lỗi đăng nhập:', err);
    res.render('login', {
      title: 'Đăng nhập',
      message: 'Lỗi hệ thống, vui lòng thử lại sau!',
      msg: null,
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login?msg=logout');
  });
};

// GET /register
exports.getRegister = (req, res) => {
  res.render('register', {
    title: 'Đăng ký',
    message: null
  });
};

// POST /register
exports.postRegister = async (req, res) => {
  try {
    const { username, password } = req.body;

    // check trùng username
    const existed = await User.findOne({ username });
    if (existed) {
      return res.render('register', {
        title: 'Đăng ký',
        message: 'Tài khoản đã tồn tại, hãy chọn tên khác.'
      });
    }

    // tạo user mới với role mặc định là 'customer'
    const newUser = new User({
      username,
      password,
      role: 'customer'
    });

    await newUser.save();

    // auto đăng nhập ngay sau khi đăng ký
    req.session.userId = newUser._id;
    req.session.role = newUser.role;
    req.session.username = newUser.username;

    return res.redirect('/');

  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).send('Lỗi server khi đăng ký');
  }
};


