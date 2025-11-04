const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

function clampRating(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(5, Math.max(1, num));
}

async function userPurchasedProduct(userId, productObjectId) {
  const order = await Order.findOne({
    userID: userId,
    status: { $in: ['done', 'shipping', 'preparing'] },
    'items.productID': productObjectId,
  }).lean();
  return Boolean(order);
}

async function recalcAverageRating(productObjectId) {
  const result = await Review.aggregate([
    { $match: { productID: productObjectId } },
    {
      $group: {
        _id: '$productID',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productObjectId, {
      avgRating: Number(result[0].avgRating.toFixed(1)),
    });
  } else {
    await Product.findByIdAndUpdate(productObjectId, { avgRating: 0 });
  }
}

exports.createOrUpdateReview = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.redirect(`/product/${productId}?msg=review-error`);
    }
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const rating = clampRating(req.body.rating);
    const comment = (req.body.comment || '').trim();

    if (!rating) {
      return res.redirect(`/product/${productId}?msg=invalid-rating`);
    }

    const purchased = await userPurchasedProduct(userId, productObjectId);
    if (!purchased) {
      return res.redirect(`/product/${productId}?msg=not-allowed`);
    }

    await Review.findOneAndUpdate(
      { productID: productObjectId, userID: userId },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await recalcAverageRating(productObjectId);

    res.redirect(`/product/${productId}?msg=review-saved`);
  } catch (err) {
    console.error('Lỗi ghi đánh giá:', err);
    res.redirect(`/product/${productId}?msg=review-error`);
  }
};
