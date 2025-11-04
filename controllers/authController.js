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
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.render('login', {
        title: 'Đăng nhập',
        message: 'Sai email hoặc mật khẩu',
        msg: null,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', {
        title: 'Đăng nhập',
        message: 'Sai email hoặc mật khẩu',
        msg: null,
      });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      loyaltyPoint: user.loyaltyPoint,
    };

    req.session.save(() => {
      if (user.isAdmin) {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
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
    const { name, email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.render('register', {
        title: 'Đăng ký',
        message: 'Email không hợp lệ.',
      });
    }

    const existed = await User.findOne({ email: normalizedEmail });
    if (existed) {
      return res.render('register', {
        title: 'Đăng ký',
        message: 'Email đã tồn tại, hãy sử dụng email khác.',
      });
    }

    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      isAdmin: false,
    });

    await newUser.save();

    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      loyaltyPoint: newUser.loyaltyPoint,
    };

    return res.redirect('/');
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).send('Lỗi server khi đăng ký');
  }
};

