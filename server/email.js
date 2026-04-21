const nodemailer = require("nodemailer");
const USER_MAP = {
  start: { email: process.env.ED_EMAIL, name: "Ed" },
  ed: { email: process.env.DIANE_EMAIL, name: "Diane" },
  diane: { email: process.env.SARA_EMAIL, name: "Sara" },
  sara: { email: "tarpfarmer@gmail.com", name: "Kristi" },
  kristi: { email: process.env.DIANE_EMAIL, name: "Diane" },
};

function emailer(user, book) {
  const target = USER_MAP[user];
  if (target && target.email) {
    const { email, name } = target;
    const subject = `${name}, ${book} is ready for you to proof!`;
    const body = `${name}, ${book} is ready for you to proof. Please visit https://server.plumfieldpress.com to make your corrections`;
    console.log(`Sending email to ${email}: ${subject}`);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "plumfieldmoms@gmail.com",
        pass: process.env.GMAIL_PASSWORD, // NOT your regular password
      },
    });

    const mailOptions = {
      from: "plumfieldmoms@gmail.com",
      to: email, //to: email
      cc: "tarpfarmer@gmail.com",
      subject: subject,
      text: body,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Email sent: " + info.response);
    });
  }
}
module.exports = emailer;
