// models/Product.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    variantName: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
    size: { type: Number, min: 0 },
    material: { type: String, trim: true },
    stock: { type: Number, min: 0, default: 0 },
    variantImg: { type: String, trim: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    img: {
      type: [String],
      default: ['/images/default-plant.jpg'],
    },
    type: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    categoryID: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    avgRating: { type: Number, min: 0, max: 5, default: 0 },
    soldCount: { type: Number, min: 0, default: 0 },
    inStock: { type: Number, min: 0, default: 0 },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', slug: 'text' });

module.exports = mongoose.model('Product', productSchema);
