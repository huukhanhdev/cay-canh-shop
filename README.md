# 🌿 Cây Cảnh Shop

Một web app bán cây cảnh mini (Node.js + Express + MongoDB + EJS), có giỏ hàng, đặt hàng COD và trang quản trị sản phẩm.  
Đóng gói bằng Docker Compose để chạy được ngay chỉ với 1 lệnh.

## ✨ Tính năng chính

- 🏠 Trang chủ hiển thị danh sách cây cảnh (ảnh, giá, mô tả ngắn)
- 🔍 Trang chi tiết sản phẩm
  - Xem mô tả đầy đủ
  - Thêm vào giỏ hàng
- 🛒 Giỏ hàng (lưu bằng session)
  - Xem các sản phẩm đã thêm
  - Cập nhật số lượng
  - Xoá sản phẩm khỏi giỏ
  - Tính tổng tiền
- 📦 Thanh toán COD (Checkout)
  - Nhập tên / số điện thoại / địa chỉ giao hàng
  - Lưu đơn hàng vào MongoDB
  - Xoá giỏ hàng sau khi đặt
- 🗂 Admin cơ bản
  - Thêm sản phẩm mới (kèm upload ảnh)
  - Danh sách sản phẩm

Giao diện được style nhẹ nhàng với CSS custom (không dùng framework nặng).  
Tone màu xanh lá, layout dạng card bo góc, responsive cơ bản.

---

## 🧱 Tech stack

- **Node.js / Express** – server web
- **EJS** – render view phía server
- **Mongoose / MongoDB** – lưu sản phẩm và đơn hàng
- **express-session** – session cho giỏ hàng
- **multer** – upload ảnh sản phẩm
- **Docker + docker-compose** – dựng cả web + database chỉ với 1 lệnh

---

## 🚀 Chạy dự án bằng Docker (cách đơn giản nhất)

Yêu cầu:
- Docker Desktop (hoặc Docker Engine + docker compose plugin)

Bước chạy:

```bash
docker compose up --build
