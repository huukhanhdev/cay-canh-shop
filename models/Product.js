const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // bắt buộc nhập
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  desc: {
    type: String,
    trim: true
  },
  img: {
    type: String,
    trim: true,
    default: '/images/default-plant.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// tạo model
module.exports = mongoose.model('Product', productSchema);
