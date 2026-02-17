const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: 'https://api.eu.mailgun.net',
});

const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    const messageData = {
      from: 'Scalez Platform <noreply@scalez.app>',
      to: email,
      subject: 'Reset Your Password - Scalez Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Scalez Platform</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>You recently requested to reset your password for your Scalez Platform account. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Scalez Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'sandbox76a89ce54e674b9ab1e4f7f5acc1a6f0.mailgun.org', messageData);
    console.log('Reset password email sent successfully:', response);
    return { success: true, messageId: response.id };
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw error;
  }
};

module.exports = {
  sendResetPasswordEmail,
};
