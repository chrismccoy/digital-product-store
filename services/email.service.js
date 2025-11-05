/**
 * Service module for sending emails via Nodemailer.
 */

const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const config = require("../config/config");
const mode = require("./mode.service");

function getTransporter() {
  if (config.email.useSendmail) {
    return nodemailer.createTransport({
      sendmail: true,
      path: config.email.sendmailPath,
    });
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port == 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

async function sendPurchaseReceipt(transaction, redownloadUrl) {
  try {
    const templatePath = mode.isShopMode()
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

    const emailHtml = await ejs.renderFile(templatePath, {
      transaction,
      productName: transaction.product.name,
      productPrice: transaction.product.price,
      redownloadUrl,
      footerDomain: config.site.footerDomain,
    });

    const mailOptions = {
      from: config.email.from,
      to: transaction.payer.email,
      subject: config.email.subject,
      html: emailHtml,
    };

    const mailer = getTransporter();
    await mailer.sendMail(mailOptions);
    console.log(`Purchase receipt sent to ${transaction.payer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send purchase receipt email:", error);
    return false;
  }
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

async function sendContactMessage(contact) {
  const to = config.email.fromEmail;
  if (!to) {
    console.error("Contact message not sent: no store email address configured.");
    return false;
  }

  try {
    const html = `
      <p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(contact.message)}</p>
    `;

    const text =
      `Name: ${contact.name}\n` +
      `Email: ${contact.email}\n\n` +
      `${contact.message}\n`;

    const mailOptions = {
      from: config.email.from,
      to,
      replyTo: contact.email,
      subject: `New contact message from ${contact.name}`,
      text,
      html,
    };

    const mailer = getTransporter();
    await mailer.sendMail(mailOptions);
    console.log(`Contact message received from ${contact.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send contact message:", error);
    return false;
  }
}

module.exports = { sendPurchaseReceipt, sendContactMessage, getTransporter };
