const USER_MAP = {
  ed: (process.env.DIANE_EMAIL, "Diane"),
  diane: (process.env.SARA_EMAIL, "Sara"),
  sara: (process.env.GRETA_EMAIL, "Greta"),
};

function emailer(user, book) {
  const email,
    nextUser = USER_MAP[user];
  if (email) {
    const subject = `${nextUser}, ${book} is ready for you to proof!`;
    const body = `<p>${nextUser},</p><p>${book} is ready for you to proof. Please visit <a href="https://server.plumfieldpress.com" target="_blank">https://server.plumfieldpress.com</a> to make your corrections</p>`;
    console.log(subject, body);
    //TODO Connect mailgun
  }
}
module.exports = emailer;
