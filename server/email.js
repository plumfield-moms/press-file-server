const USER_MAP = {
  start: { email: process.env.ED_EMAIL, name: "ED" },
  ed: { email: process.env.DIANE_EMAIL, name: "Diane" },
  diane: { email: process.env.SARA_EMAIL, name: "Sara" },
  sara: { email: process.env.GRETA_EMAIL, name: "Greta" },
};

function emailer(user, book) {
  const target = USER_MAP[user];
  if (target && target.email) {
    const { email, name } = target;
    const subject = `${name}, ${book} is ready for you to proof!`;
    const body = `<p>${name},</p><p>${book} is ready for you to proof. Please visit <a href="https://server.plumfieldpress.com" target="_blank">https://server.plumfieldpress.com</a> to make your corrections</p>`;
    console.log(`Sending email to ${email}: ${subject}`);
    //TODO Connect mailgun
  }
}
module.exports = emailer;
