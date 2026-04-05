import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Use user's SMTP credentials if provided, otherwise create Ethereal testing account
  let transporter;
  
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT, // e.g., 587 or 465
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email (Only used for Testing/Development)
    console.log("No SMTP details found in .env. Using Ethereal Email for testing...");
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  // Define email template
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #0d6efd; text-align: center;">DirectGig Password Reset</h2>
      <p>Hello,</p>
      <p>You or someone else has requested a password reset for your DirectGig account.</p>
      <p>Please click the button below to reset your password. This link will expire in 15 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${options.resetUrl}" style="background-color: #0d6efd; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #555;"><a href="${options.resetUrl}">${options.resetUrl}</a></p>
      <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p style="font-size: 12px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} DirectGig. All rights reserved.</p>
    </div>
  `;

  const message = {
    from: `${process.env.FROM_NAME || 'DirectGig'} <${process.env.FROM_EMAIL || 'noreply@directgig.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text alternative
    html: htmlTemplate,    // HTML body
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
  // Preview only available when sending through an Ethereal account
  if (!process.env.SMTP_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};

export default sendEmail;
