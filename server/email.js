const nodemailer = require("nodemailer");

const USER_MAP = {
  start: { email: process.env.ED_EMAIL, name: "Ed" },
  ed: { email: process.env.DIANE_EMAIL, name: "Diane" },
  diane: { email: process.env.SARA_EMAIL, name: "Sara" },
  sara: { email: "tarpfarmer@gmail.com", name: "Kristi" },
  kristi: { email: process.env.DIANE_EMAIL, name: "Diane" },
  "diane-2": { email: process.env.SARA_EMAIL, name: "Sara" },
};

// Create a single transporter instance to reuse connections
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "plumfieldmoms@gmail.com",
    pass: process.env.GMAIL_PASSWORD,
  },
});

function emailer(user, book) {
  const target = USER_MAP[user];
  if (target && target.email) {
    const { email, name } = target;
    const subject = `${name}, ${book} is ready for you to proof!`;
    const body = `${name}, ${book} is ready for you to proof. Please visit https://server.plumfieldpress.com to make your corrections`;
    
    console.log(`[Email] Preparing message for ${email}: ${subject}`);

    const mailOptions = {
      from: "plumfieldmoms@gmail.com",
      to: email,
      cc: "tarpfarmer@gmail.com",
      subject: subject,
      text: body,
    };

    // sendMail is asynchronous, so it won't block the sync loop
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("[Email] Error:", error);
      }
      console.log("[Email] Sent: " + info.response);
    });
  }
}

module.exports = emailer;
