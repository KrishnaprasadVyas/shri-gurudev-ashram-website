/**
 * WhatsApp Service using WAApiHub
 * Handles sending WhatsApp messages via simple text API
 * API Docs: https://www.waapihub.com/
 */

const WA_BASE_URL = process.env.WA_BASE_URL || "https://api.waapihub.com";
const WA_API_KEY = process.env.WA_API_KEY;

/**
 * Send login OTP via WhatsApp
 * @param {string} phone - Phone number with country code (e.g., "+91-8956964895" or "918956964895")
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
exports.sendLoginOtp = async (phone, otp) => {
  try {
    // Validate environment variables
    if (!WA_API_KEY) {
      console.error("WhatsApp service: Missing WA_API_KEY");
      return {
        success: false,
        error: "WhatsApp service not configured",
      };
    }

    // Validate OTP
    if (!otp || otp.toString().length !== 6) {
      return {
        success: false,
        error: "Invalid OTP format",
      };
    }

    // Format phone number - ensure it has country code
    let formattedPhone = phone.toString().trim();
    
    // If phone starts with 91 (India code without +), add + and -
    if (formattedPhone.match(/^91\d{10}$/)) {
      formattedPhone = `+${formattedPhone.slice(0, 2)}-${formattedPhone.slice(2)}`;
    }
    // If phone starts with 0, replace with +91-
    else if (formattedPhone.match(/^0\d{10}$/)) {
      formattedPhone = `+91-${formattedPhone.slice(1)}`;
    }
    // If phone is just 10 digits, add +91-
    else if (formattedPhone.match(/^\d{10}$/)) {
      formattedPhone = `+91-${formattedPhone}`;
    }

    // Format message with OTP
    const message = `Your OTP is: ${otp}\nDo not share this with anyone.\nValid for 10 minutes.`;

    const response = await fetch(`${WA_BASE_URL}/v1/chat/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ApiKey: WA_API_KEY,
      },
      body: JSON.stringify({
        receiver: formattedPhone,
        message: message,
      }),
      timeout: 10000, // 10 second timeout
    });

    const data = await response.json();

    if (response.ok && (response.status === 200 || response.status === 201)) {
      return {
        success: true,
        messageId: data.messageId || data.id || "sent",
      };
    }

    return {
      success: false,
      error: data.message || "Failed to send message via WhatsApp API",
    };
  } catch (error) {
    // Log error for debugging but don't expose details
    console.error(
      "WhatsApp OTP send failed:",
      error.message
    );

    // Return generic error to caller
    return {
      success: false,
      error: "Failed to send OTP via WhatsApp",
    };
  }
};

/**
 * Send generic WhatsApp message
 * @param {string} phone - Phone number with country code
 * @param {string} message - Message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
exports.sendMessage = async (phone, message) => {
  try {
    // Validate environment variables
    if (!WA_API_KEY) {
      console.error("WhatsApp service: Missing WA_API_KEY");
      return {
        success: false,
        error: "WhatsApp service not configured",
      };
    }

    // Validate message
    if (!message || message.toString().trim().length === 0) {
      return {
        success: false,
        error: "Message cannot be empty",
      };
    }

    // Format phone number
    let formattedPhone = phone.toString().trim();
    
    if (formattedPhone.match(/^91\d{10}$/)) {
      formattedPhone = `+${formattedPhone.slice(0, 2)}-${formattedPhone.slice(2)}`;
    } else if (formattedPhone.match(/^0\d{10}$/)) {
      formattedPhone = `+91-${formattedPhone.slice(1)}`;
    } else if (formattedPhone.match(/^\d{10}$/)) {
      formattedPhone = `+91-${formattedPhone}`;
    }

    const response = await fetch(`${WA_BASE_URL}/v1/chat/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ApiKey: WA_API_KEY,
      },
      body: JSON.stringify({
        receiver: formattedPhone,
        message: message,
      }),
      timeout: 10000,
    });

    const data = await response.json();

    if (response.ok && (response.status === 200 || response.status === 201)) {
      return {
        success: true,
        messageId: data.messageId || data.id || "sent",
      };
    }

    return {
      success: false,
      error: data.message || "Failed to send message via WhatsApp API",
    };
  } catch (error) {
    console.error("WhatsApp message send failed:", error.message);
    return {
      success: false,
      error: "Failed to send message via WhatsApp",
    };
  }
};
