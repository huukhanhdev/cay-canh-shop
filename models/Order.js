const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone:        { type: String, required: true },
    address:      { type: String, required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        qty: Number,
        img: String
      }
    ],

    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'done', 'canceled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
