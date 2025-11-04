const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// helper: tính tổng tiền đơn
function calcOrderTotal(order) {
  if (order.totalPrice) return order.totalPrice;

  if (Array.isArray(order.items)) {
    return order.items.reduce((sum, it) => {
      const lineTotal =
        typeof it.subTotal === 'number'
          ? it.subTotal
          : (it.price || 0) * (it.quantity || it.qty || 0);
      return sum + lineTotal;
    }, 0);
  }
  return 0;
}

exports.getDashboard = async (req, res) => {
  try {
    // 1. Lấy tất cả đơn hàng
    const orders = await Order.find().lean();

    // 2. Tổng số đơn
    const totalOrders = orders.length;

    // 3. Tổng doanh thu (chỉ tính các đơn status 'done' | 'delivered' | 'completed')
    const finishedOrders = orders.filter((o) =>
      ['done'].includes(o.status)
    );

    const totalRevenue = finishedOrders.reduce((sum, o) => {
      return sum + calcOrderTotal(o);
    }, 0);

    // 4. Tổng số khách hàng (không bao gồm admin)
    const totalCustomers = await User.countDocuments({
      isAdmin: false,
    });

    // 5. Top sản phẩm bán chạy
    // Ý tưởng: gom số lượng từ tất cả orders.items
    const soldMap = {}; // { productId: { name, qty } }

    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item) => {
        const productId = String(item.productID || item.productId || '');
        if (!productId) return;

        if (!soldMap[productId]) {
          soldMap[productId] = {
            name: item.productName || item.name || 'Sản phẩm',
            qty: 0,
          };
        }
        soldMap[productId].qty += item.quantity || item.qty || 0;
      });
    });

    // convert object -> array -> sort giảm dần
    const bestSellersArr = Object.entries(soldMap)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        qty: data.qty,
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
