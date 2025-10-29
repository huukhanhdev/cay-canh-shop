const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      qty: Number,
    },
  ],
  total: Number,
  customerName: String,
  phone: String,
  address: String,
  note: String,
  status: {
    type: String,
    enum: ['pending', 'preparing', 'shipping', 'done', 'canceled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
