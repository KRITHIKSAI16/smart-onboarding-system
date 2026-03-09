const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

const sendEmail = async (to, subject, text) => {

  const mailOptions = {
    from: "onboarding@system.com",
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;