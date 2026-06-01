import axios from "axios";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export const sendOTP = async (email: string, otp: string) => {
  if (!BREVO_API_KEY) {
    console.log(`[MOCK EMAIL] To: ${email}, OTP: ${otp}`);
    return;
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "KL SmartQ", email: "baralswaraj4@gmail.com" },
        to: [{ email }],
        subject: "Your KL SmartQ Verification Code",
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-w-md: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border-top: 4px solid #10b981; text-align: center;">
              <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 8px;">KL SmartQ</h1>
              <p style="color: #64748b; font-size: 16px; margin-bottom: 32px;">Secure Identity Verification</p>
              
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <p style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600;">Your Verification Code</p>
                <div style="font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: 6px;">${otp}</div>
              </div>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: left;">
                This code is valid for <strong>10 minutes</strong>. Please do not share this code with anyone. If you didn't request this verification, you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} KL University. All rights reserved.</p>
            </div>
          </div>
        `,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Sent OTP to ${email} via Brevo.`);
  } catch (err: any) {
    console.error("Failed to send OTP via Brevo:", err?.response?.data || err.message);
    console.log(`[FALLBACK MOCK EMAIL] To: ${email}, OTP: ${otp}`);
    // We swallow the error so the user isn't blocked by a bad API key during testing.
  }
};
