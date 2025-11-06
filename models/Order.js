// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantID: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    nameSnapshot: { type: String, required: true },   // tên tại thời điểm đặt
    unitPrice: { type: Number, required: true, min: 0 }, // giá chốt để thanh toán
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    number: String,
    street: String,
    district: String,
    city: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // thông tin người nhận
    receiverName: { type: String, required: true },
    receiverPhone: { type: String, required: true },
    shippingAddress: { type: addressSchema, required: true },

    orderDetails: { type: [orderItemSchema], required: true },

    // phần tính tiền
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 }, // áp mã / khuyến mại
    pointUsed: { type: Number, required: true, min: 0, default: 0 },      // điểm khách dùng
    pointEarned: { type: Number, required: true, min: 0, default: 0 },    // điểm thưởng cộng lại
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'done', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
