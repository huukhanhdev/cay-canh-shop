exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user) return next();
  return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
};
exports.requireAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'admin') return next();
  return res.status(403).send('Forbidden');
};

// gắn locals cho header
exports.exposeUser = (req, res, next) => {
  res.locals.isLoggedIn = !!req.session?.user;
  res.locals.username = req.session?.user?.fullName || req.session?.user?.email;
  res.locals.role = req.session?.user?.role || 'customer';
  next();
};
