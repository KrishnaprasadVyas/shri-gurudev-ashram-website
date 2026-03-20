import { RecaptchaVerifier } from "firebase/auth";

let recaptchaVerifier = null;
let recaptchaWidgetId = null;

export const resetRecaptcha = () => {
  if (window.grecaptcha && recaptchaWidgetId !== null) {
    try {
      window.grecaptcha.reset(recaptchaWidgetId);
    } catch {
      // Ignore if widget is not ready or already removed.
    }
  }

  recaptchaWidgetId = null;

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup failures from stale instances.
    }
    recaptchaVerifier = null;
  }
};

export const setupRecaptcha = async (auth, containerId = "recaptcha-container") => {
  resetRecaptcha();

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {
      resetRecaptcha();
    },
  });

  recaptchaWidgetId = await recaptchaVerifier.render();
  return recaptchaVerifier;
};

export const cleanupRecaptcha = () => {
  resetRecaptcha();
};
