const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { requireLogin } = require('../middleware/auth');

// form checkout
router.get('/', requireLogin, checkoutController.getCheckoutPage);

// submit đơn hàng
router.post('/', requireLogin, checkoutController.postCheckout);

module.exports = router;
