exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.isLoggedIn = true;
    res.locals.username = req.session.user.username;
    res.locals.role = req.session.user.role;
  } else {
    res.locals.isLoggedIn = false;
    res.locals.username = null;
    res.locals.role = null;
  }
  next();
};

// Chặn nếu chưa đăng nhập
exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login?msg=please-login');
};

// Chặn nếu không phải admin
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Bạn không có quyền truy cập.');
};