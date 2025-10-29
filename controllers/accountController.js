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

    const user = await User.findById(userId);

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

    const { fullName, email, phone, address } = req.body;

    // cập nhật
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        email,
        phone,
        address,
      },
      { new: true } // trả về bản đã update
    );

    if (!updatedUser) {
      return res.status(404).send('Không tìm thấy tài khoản để cập nhật');
    }

    // đồng bộ lại session cho đẹp (để header có thể show tên nếu sau này muốn)
    req.session.user.fullName = updatedUser.fullName;
    req.session.user.email = updatedUser.email;
    req.session.user.phone = updatedUser.phone;
    req.session.user.address = updatedUser.address;

    res.render('account-profile', {
      title: 'Hồ sơ cá nhân',
      user: updatedUser,
      message: null,
      success: 'Cập nhật thông tin thành công ✅',
    });
  } catch (err) {
    console.error('Lỗi postProfileUpdate:', err);
    res.status(500).send('Không thể cập nhật thông tin 😢');
  }
};
