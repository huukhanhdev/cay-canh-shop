// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.get('/login', auth.getLogin);
router.post('/login', auth.postLogin);
router.post('/logout', auth.postLogout);

router.get('/register', auth.getRegister);
router.post('/register', auth.postRegister);

router.get('/forgot', auth.getForgot);
router.post('/forgot', auth.postForgotSendOtp);

router.get('/verify', auth.getVerify);
router.post('/verify-otp', auth.postVerifyOtp);

router.get('/set-password', auth.getSetPassword);
router.post('/set-password', auth.postSetPassword);

router.get('/reset', auth.getReset);
router.post('/reset', auth.postReset);

module.exports = router;
