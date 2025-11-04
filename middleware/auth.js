exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.isLoggedIn = true;
    res.locals.userName = req.session.user.name;
    res.locals.userEmail = req.session.user.email;
    res.locals.isAdmin = !!req.session.user.isAdmin;
    res.locals.loyaltyPoint = req.session.user.loyaltyPoint || 0;
  } else {
    res.locals.isLoggedIn = false;
    res.locals.userName = null;
    res.locals.userEmail = null;
    res.locals.isAdmin = false;
    res.locals.loyaltyPoint = 0;
  }
  next();
};

exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login?msg=please-login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  return res.status(403).send('Bạn không có quyền truy cập.');
};
