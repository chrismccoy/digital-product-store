/**
 * A script to test the Nodemailer configuration.
 */

// Load environment variables from the .env file, just like in server.js
require("dotenv").config();

const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer
 */
async function sendTestEmail(recipientEmail) {
  let transporter;

  // Check if the application is configured to use the local Sendmail command.
  if (process.env.EMAIL_USE_SENDMAIL === "true") {
    console.log("TEST: Initializing Nodemailer with Sendmail transport.");
    transporter = nodemailer.createTransport({
      sendmail: true,
      // Optionally specify the path if it's not in the system's default PATH.
      path: process.env.SENDMAIL_PATH || "/usr/sbin/sendmail",
    });
  } else {
    console.log("TEST: Initializing Nodemailer with SMTP transport.");
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Define the Email Options
  const mailOptions = {
    from: process.env.EMAIL_FROM, // The "From" address from your .env file
    to: recipientEmail, // The recipient's email, passed from the command line
    subject: "Nodemailer Test Email from Secure Paypal App",
    text: "Hello World! Your Nodemailer configuration is working correctly.",
    html: "<h1>Hello World!</h1><p>Your Nodemailer configuration is working correctly.</p>",
  };

  // Send the Email and Log the Result
  try {
    console.log(`Attempting to send a test email to ${recipientEmail}...`);
    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Preview URL (if using Ethereal/Mailtrap):", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("❌ Failed to send email.");
    console.error("Error details:", error);
  }
}

// Get the recipient's email from the command-line arguments.
const recipient = process.argv[2];

// Validate that an email address was provided.
if (!recipient) {
  console.error("Please provide a recipient's email address.");
  console.error("Usage: node test-email.js recipient@example.com");
  process.exit(1);
}

// Run the main function with the provided email address.
sendTestEmail(recipient);
