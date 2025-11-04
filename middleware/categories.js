// middleware/categories.js
const Category = require('../models/Category');

module.exports = async function categoriesToLocals(req, res, next) {
  try {
    const list = await Category.find().sort({ name: 1 }).lean();
    res.locals.categories = list; // header.ejs dùng biến này
  } catch (e) {
    res.locals.categories = [];
  }
  next();
};
