import { useState } from "react";
import { useTranslation } from "react-i18next";
import SectionHeading from "../components/SectionHeading";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { validateEmail, validatePhone } from "../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("contact.nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("contact.emailRequired");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("contact.emailInvalid");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("contact.phoneRequired");
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("contact.phoneInvalid");
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t("contact.subjectRequired");
    }

    if (!formData.message.trim()) {
      newErrors.message = t("contact.messageRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) throw new Error(data.message);

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <SectionHeading title={t("contact.sendMessage")} />
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  {t("contact.successMessage")}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label={t("contact.fullName")}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("contact.namePlaceholder")}
                  required
                  error={errors.name}
                />
                <FormInput
                  label={t("contact.emailLabel")}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("contact.emailPlaceholder")}
                  required
                  error={errors.email}
                />
                <FormInput
                  label={t("contact.phoneLabel")}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("contact.phonePlaceholder")}
                  required
                  error={errors.phone}
                />
                <FormInput
                  label={t("contact.subject")}
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t("contact.subjectPlaceholder")}
                  required
                  error={errors.subject}
                />
                <div className="mb-4">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t("contact.message")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.message
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-amber-500"
                    }`}
                    placeholder={t("contact.messagePlaceholder")}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.message}
                    </p>
                  )}
                </div>
                <PrimaryButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting
                    ? t("contact.sending")
                    : t("contact.sendButton")}
                </PrimaryButton>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <SectionHeading title={t("contact.getInTouch")} />
              <div className="space-y-6">
                <div className="bg-amber-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-amber-900 mb-4">
                    {t("contact.contactInfo")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("contact.addressLabel")}
                        </p>
                        <p className="text-gray-700">
                          {t("footer.ashramAddress1")}
                          <br />
                          {t("footer.ashramAddress2")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("contact.phoneTitle")}
                        </p>
                        <p className="text-gray-700">9158740007</p>
                        <p className="text-gray-700">9834151577</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {t("contact.emailTitle")}
                        </p>
                        <p className="text-gray-700">
                          <a
                            href="mailto:info@shrigurudevashram.org"
                            className="text-amber-600 hover:underline"
                          >
                            info@shrigurudevashram.org
                          </a>
                        </p>
                        <p className="text-gray-700">
                          <a
                            href="mailto:info@shantiashramtrust.org"
                            className="text-amber-600 hover:underline"
                          >
                            info@shantiashramtrust.org
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="bg-amber-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-amber-900 mb-4">
                    {t("contact.findUs")}
                  </h3>
                  <div className="w-full h-64 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps?q=Shri+Gurudev+Ashram+Palaskhed+Sapkal+Chikhli+Buldhana+Maharashtra+443001&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ashram Location"
                    ></iframe>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Shri+Gurudev+Ashram+Palaskhed+Sapkal+Chikhli+Buldhana+Maharashtra+443001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline"
                    >
                      {t("contact.openMaps")}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
