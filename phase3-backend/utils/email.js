let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️ nodemailer is not installed. Falling back to console-only logging.');
}

/**
 * Sends an OTP email to the user.
 * Falls back to console log if SMTP credentials are not configured.
 * 
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} reason - The purpose of the OTP ('login', 'register', 'reset')
 */
const sendOtpEmail = async (email, otp, reason) => {
  const reasonText = 
    reason === 'reset' ? 'Resetting Your Password' :
    reason === 'register' ? 'Creating Your Account' : 'Logging In to PlacementAI';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); color: #f8fafc;">
      <h2 style="color: #ffffff; text-align: center; margin-bottom: 5px; font-weight: 800; font-size: 24px;">
        Placement<span style="color: #8b5cf6;">AI</span>
      </h2>
      <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 0; margin-bottom: 25px;">
        Empowering Your Career Preparation
      </p>
      
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #cbd5e1; font-size: 15px; margin-top: 0; margin-bottom: 15px;">
          Your verification code for <strong>${reasonText}</strong> is:
        </p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #8b5cf6; padding: 10px 0; font-family: monospace;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 15px; margin-bottom: 0;">
          This code is valid for 5 minutes. Please do not share this OTP with anyone.
        </p>
      </div>
      
      <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.5; margin-bottom: 0;">
        If you did not request this code, you can safely ignore this email.<br>
        © ${new Date().getFullYear()} PlacementAI. All rights reserved.
      </p>
    </div>
  `;

  const textContent = `PlacementAI\n\nYour OTP for ${reasonText} is: ${otp}\nThis code is valid for 5 minutes.`;

  console.log(`\n======================================================`);
  console.log(`✉️  EMAIL SENT TO: ${email}`);
  console.log(`🔑  OTP CODE     : ${otp}`);
  console.log(`🎯  REASON       : ${reasonText}`);
  console.log(`======================================================\n`);

  // Check if SMTP environment variables are available
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (nodemailer && SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: EMAIL_FROM || `"PlacementAI" <${SMTP_USER}>`,
        to: email,
        subject: `[PlacementAI] Verification Code: ${otp}`,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Real email successfully sent to ${email} via SMTP.`);
      return { success: true, method: 'smtp' };
    } catch (error) {
      console.error(`❌ Failed to send SMTP email: ${error.message}`);
      return { success: false, method: 'console_fallback', error: error.message };
    }
  }

  // If no SMTP configured, we return success but notify that console log was used
  return { success: true, method: 'console_only' };
};

module.exports = { sendOtpEmail };
