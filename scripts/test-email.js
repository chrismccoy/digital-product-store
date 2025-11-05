/**
 * A script to test the Nodemailer configuration.
 */

require("dotenv").config();

const nodemailer = require("nodemailer");
const emailService = require("../services/email.service");
const config = require("../config/config");

async function sendTestEmail(recipientEmail) {
  const transporter = emailService.getTransporter();

  const fromAddress = config.email.from;
  if (!fromAddress) {
    console.warn(
      "⚠ No From address is configured. Set the sender name/email on the admin Settings > Email tab first.",
    );
  }

  const mailOptions = {
    from: fromAddress, // The "From" address from the admin email settings
    to: recipientEmail, // The recipient's email, passed from the command line
    subject: "Nodemailer Test Email from Secure Paypal App",
    text: "Hello World! Your Nodemailer configuration is working correctly.",
    html: "<h1>Hello World!</h1><p>Your Nodemailer configuration is working correctly.</p>",
  };

  try {
    console.log(`Attempting to send a test email to ${recipientEmail}...`);
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Preview URL (if using Ethereal/Mailtrap):", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Failed to send email.");
    console.error("Error details:", error);
  }
}

const recipient = process.argv[2];

if (!recipient) {
  console.error("Please provide a recipient's email address.");
  console.error("Usage: node test-email.js recipient@example.com");
  process.exit(1);
}

sendTestEmail(recipient);
