const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ShippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  phone: { type: String, trim: true },
  street: { type: String, trim: true },
  district: { type: String, trim: true },
  city: { type: String, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const OTPSchema = new mongoose.Schema({
  code: String,
  purpose: { type: String, enum: ['register','reset'], required: true },
  expiresAt: Date,
  attempts: { type: Number, default: 0 },   // chống brute-force
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  password: { type: String },                        // đăng ký xong mới đặt, hoặc đặt trong reset
  shippingAddresses: { type: [ShippingAddressSchema], default: [] },
  isVerified: { type: Boolean, default: false },     // verified qua OTP đăng ký
  otp: OTPSchema,                                     // lưu OTP hiện thời
  loyaltyPoints: { type: Number, default: 0 },
  role: { type: String, enum: ['customer','admin'], default: 'customer' }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(raw) {
  if (!this.password) return false;
  return bcrypt.compare(raw, this.password);
};

module.exports = mongoose.model('User', UserSchema);
