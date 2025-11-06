// utils/mailer.js
const nodemailer = require('nodemailer');

function makeTransport() {
  // Nếu chưa set SMTP, dùng "console mode" để không bị crash
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
      sendMail: async (opts = {}) => {
        // fallback: in ra console cho môi trường dev
        console.log('=== DEV MAIL (no SMTP configured) ===');
        console.log('To:   ', opts.to);
        console.log('Subj: ', opts.subject);
        console.log('Text: ', opts.text);
        console.log('HTML: ', opts.html);
        console.log('=====================================');
        return { messageId: 'dev-console-mail' };
      },
    };
  }

  // SMTP thật
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true', // true nếu 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = makeTransport();

async function sendMail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || `"Cay Canh Shop" <no-reply@caycanh.local>`,
    to,
    subject,
    text,
    html,
  });
}

// Gửi OTP dùng sẵn
async function sendOTPEmail(to, otp) {
  const subject = 'Mã xác thực OTP';
  const text = `Mã OTP của bạn là: ${otp}. Hiệu lực 5 phút.`;
  const html = `<p>Mã OTP của bạn là: <b style="font-size:18px">${otp}</b></p><p>Hiệu lực 5 phút.</p>`;
  return sendMail({ to, subject, text, html });
}

module.exports = { sendMail, sendOTPEmail };
