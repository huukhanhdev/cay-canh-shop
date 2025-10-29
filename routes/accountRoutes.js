// routes/accountRoutes.js
const express = require('express');
const router = express.Router();

const accountController = require('../controllers/accountController');
const { requireLogin } = require('../middleware/auth');

// xem hồ sơ
router.get('/profile', requireLogin, accountController.getProfilePage);

// cập nhật hồ sơ
router.post('/profile', requireLogin, accountController.postProfileUpdate);

module.exports = router;
