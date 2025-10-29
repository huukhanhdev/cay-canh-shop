const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    },    
    {
    timestamps: true,
    }
);

// Mã hoá mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
