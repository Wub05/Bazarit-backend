import { generateOtp, verifyOtp } from "../services/otpService.js";

//request otp
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone is required." });

    await generateOtp(phone);
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (err) {
    res.status(429).json({ error: err.message });
  }
};

//confirm otp
export const confirmOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code)
      return res.status(400).json({ error: "Phone and code are required." });

    await verifyOtp(phone, code);
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
