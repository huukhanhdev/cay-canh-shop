// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantID: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null }, // nếu đã tách biến thể
    quantity: { type: Number, required: true, min: 1, default: 1 },

    // Tùy chọn: snapshot giá tại thời điểm đưa vào giỏ (để hiển thị nhanh),
    // nhưng KHÔNG dùng làm căn cứ thanh toán cuối cùng.
    unitPriceSnapshot: { type: Number, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    // không có discount / shippingFee / pointUsed ở đây
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

cartSchema.index({ userID: 1 });

module.exports = mongoose.model('Cart', cartSchema);
