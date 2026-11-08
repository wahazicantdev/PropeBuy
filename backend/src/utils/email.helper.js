import { BREVO_API_KEY, EMAIL_FROM } from "../config/env.js";

// Sends the registration code. Uses an email API over HTTPS because
// hosting providers can block direct mail ports.
export const sendOtpEmail = async (email, code) => {
  // Local development without a key — print the code instead of emailing
  if (!BREVO_API_KEY && process.env.NODE_ENV !== "production") {
    console.log(`[DEV ONLY] Email OTP for ${email}: ${code}`);
    return;
  }

  // A live server must never run without a working email setup
  if (!BREVO_API_KEY || !EMAIL_FROM) {
    throw new Error("Email service is not configured");
  }

  // Brevo transactional email, direct fetch with no SDK
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "PropeBuy", email: EMAIL_FROM },
      to: [{ email }],
      subject: "Your PropeBuy verification code",
      htmlContent: `<p>Your PropeBuy verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`,
    }),
  });

  // Surface failures so the controller can tell the user to retry
  if (!response.ok) {
    throw new Error(`Email API responded with ${response.status}`);
  }
};
