const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// form checkout
router.get('/', checkoutController.getCheckoutPage);

// submit đơn hàng
router.post('/', checkoutController.postCheckout);

module.exports = router;
