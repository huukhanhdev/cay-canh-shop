// controllers/accountController.js
const User = require('../models/User');

// Hiển thị trang hồ sơ
exports.getProfilePage = async (req, res) => {
  try {
    // user phải đăng nhập, mình dùng session
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect('/login?msg=please-login');
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).send('Không tìm thấy tài khoản');
    }

    // render form với data hiện tại
    res.render('account-profile', {
      title: 'Hồ sơ cá nhân',
      user,
      message: null,
      success: null,
    });
  } catch (err) {
    console.error('Lỗi getProfilePage:', err);
    res.status(500).send('Lỗi tải thông tin tài khoản 😢');
  }
};

// Xử lý cập nhật hồ sơ
exports.postProfileUpdate = async (req, res) => {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect('/login?msg=please-login');
    }

    const {
      name,
      email,
      addressNumber,
      street,
      district,
      city,
    } = req.body;

    const updatePayload = {
      name,
      email,
      shippingAddress: {
        number: addressNumber,
        street,
        district,
        city,
        isDefault: true,
      },
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).send('Không tìm thấy tài khoản để cập nhật');
    }

    // đồng bộ lại session cho đẹp (để header có thể show tên nếu sau này muốn)
    req.session.user.name = updatedUser.name;
    req.session.user.email = updatedUser.email;
    req.session.user.loyaltyPoint = updatedUser.loyaltyPoint;

    res.render('account-profile', {
      title: 'Hồ sơ cá nhân',
      user: updatedUser.toObject(),
      message: null,
      success: 'Cập nhật thông tin thành công ✅',
    });
  } catch (err) {
    console.error('Lỗi postProfileUpdate:', err);
    res.status(500).send('Không thể cập nhật thông tin 😢');
  }
};
