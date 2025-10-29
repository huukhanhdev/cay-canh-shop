const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// helper: tính tổng tiền đơn
function calcOrderTotal(order) {
  // nếu model Order của anh đã có total thì xài luôn order.total
  // còn nếu chỉ có mảng items {price, qty} thì mình cộng tay
  if (order.total) return order.total;

  if (Array.isArray(order.items)) {
    return order.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }
  return 0;
}

exports.getDashboard = async (req, res) => {
  try {
    // 1. Lấy tất cả đơn hàng
    const orders = await Order.find();

    // 2. Tổng số đơn
    const totalOrders = orders.length;

    // 3. Tổng doanh thu (chỉ tính các đơn status 'done' | 'delivered' | 'completed')
    const finishedOrders = orders.filter(o =>
      ['done', 'completed', 'delivered'].includes(o.status)
    );

    const totalRevenue = finishedOrders.reduce((sum, o) => {
      return sum + calcOrderTotal(o);
    }, 0);

    // 4. Tổng số khách hàng (user role = "customer" hoặc "user")
    const totalCustomers = await User.countDocuments({
      role: { $in: ['customer', 'user'] }
    });

    // 5. Top sản phẩm bán chạy
    // Ý tưởng: gom số lượng từ tất cả orders.items
    const soldMap = {}; // { productId: { name, qty } }

    orders.forEach(order => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach(item => {
        // item.productId, item.name, item.qty
        if (!soldMap[item.productId]) {
          soldMap[item.productId] = {
            name: item.name || 'Sản phẩm',
            qty: 0
          };
        }
        soldMap[item.productId].qty += item.qty || item.quantity || 0;
      });
    });

    // convert object -> array -> sort giảm dần
    const bestSellersArr = Object.entries(soldMap)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        qty: data.qty
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // top 5

    // 6. Truyền qua view
    res.render('admin-dashboard', {
      title: 'Bảng điều khiển',
      totalOrders,
      totalRevenue,
      totalCustomers,
      bestSellers: bestSellersArr
    });
  } catch (err) {
    console.error('Lỗi getDashboard:', err);
    res.status(500).send('Lỗi tải dashboard admin');
  }
};
