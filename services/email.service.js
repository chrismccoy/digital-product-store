/**
 * Service module for sending emails via Nodemailer.
 */

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const config = require("../config/config");

let transporter;

/**
 * Creates the Nodemailer transporter instance based on .env config.
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (config.email.useSendmail) {
    // Configure to use the local `sendmail` command, common on Linux servers.
    transporter = nodemailer.createTransport({
      sendmail: true,
      path: config.email.sendmailPath,
    });
  } else {
    // Configure to use an external SMTP server.
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port == 465, // `secure` is true only if the port is 465 (SSL).
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
}

/**
 * Renders a purchase receipt email using an EJS template and sends it to the customer.
 * It dynamically selects the correct EJS template based on the application mode.
 */
async function sendPurchaseReceipt(transaction, redownloadUrl) {
  try {
    // Dynamically choose the correct email template path based on the application mode.
    const templatePath = config.isShopMode
      ? path.join(
          __dirname,
          "..",
          "views",
          "shop",
          "email",
          "purchase-receipt.ejs",
        )
      : path.join(
          __dirname,
          "..",
          "views",
          "single",
          "email",
          "purchase-receipt.ejs",
        );

    // Render the chosen EJS template into an HTML string.
    const emailHtml = await ejs.renderFile(templatePath, {
      transaction,
      productName: config.product.name, // Only used by the single-mode template
      productPrice: config.product.price, // Only used by the single-mode template
      redownloadUrl,
      footerDomain: config.site.footerDomain,
    });

    // Define the email's options (headers, content, etc.).
    const mailOptions = {
      from: config.email.from,
      to: transaction.payer.email,
      subject: config.email.subject,
      html: emailHtml,
    };

    // Get the transporter instance and send the email.
    const mailer = getTransporter();
    await mailer.sendMail(mailOptions);
    console.log(`Purchase receipt sent to ${transaction.payer.email}`);
  } catch (error) {
    console.error("Failed to send purchase receipt email:", error);
  }
}

module.exports = { sendPurchaseReceipt };
