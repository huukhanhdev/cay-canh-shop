const Category = require('../models/Category');
const slugify = str => str
  .toString()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // bỏ dấu
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

exports.listCategories = async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean();
  const parentMap = new Map(
    categories.map((cat) => [String(cat._id), cat.name])
  );
  const viewCategories = categories.map((cat) => ({
    ...cat,
    parentName: cat.parentCategoryID
      ? parentMap.get(String(cat.parentCategoryID)) || '—'
      : '—',
  }));
  res.render('admin-categories', {
    categories: viewCategories,
    title: 'Quản lý danh mục',
  });
};

exports.getNewCategory = async (req, res) => {
  const parents = await Category.find().sort({ name: 1 }).lean();
  res.render('admin-category-form', { title: 'Thêm danh mục', mode: 'create', category: null, parents });
};

exports.postNewCategory = async (req, res) => {
  const { name, parentCategoryID } = req.body;
  await Category.create({
    name,
    slug: slugify(name),
    parentCategoryID: parentCategoryID || null,
  });
  res.redirect('/admin/categories');
};

exports.getEditCategory = async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) return res.status(404).send('Không tìm thấy danh mục');
  const parents = await Category.find({ _id: { $ne: category._id } }).sort({ name: 1 }).lean();
  res.render('admin-category-form', { title: 'Sửa danh mục', mode: 'edit', category, parents });
};

exports.postEditCategory = async (req, res) => {
  const { name, parentCategoryID } = req.body;
  await Category.findByIdAndUpdate(req.params.id, {
    name,
    slug: slugify(name),
    parentCategoryID: parentCategoryID || null
  });
  res.redirect('/admin/categories');
};

exports.deleteCategory = async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.redirect('/admin/categories');
};
