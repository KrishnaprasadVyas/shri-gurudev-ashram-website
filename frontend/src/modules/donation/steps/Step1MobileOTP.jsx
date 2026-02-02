import { useState } from 'react';
import FormInput from '../../../components/FormInput';
import PrimaryButton from '../../../components/PrimaryButton';

const COUNTRY_OPTIONS = [
  { value: "IN", label: "India", dialCode: "+91", length: 10 },
  { value: "US", label: "United States", dialCode: "+1", length: 10 },
  { value: "CA", label: "Canada", dialCode: "+1", length: 10 },
  { value: "GB", label: "United Kingdom", dialCode: "+44", length: 10 },
  { value: "AU", label: "Australia", dialCode: "+61", length: 9 },
  { value: "JP", label: "Japan", dialCode: "+81", length: 10 },
  { value: "AE", label: "United Arab Emirates", dialCode: "+971", length: 9 },
  { value: "DE", label: "Germany", dialCode: "+49", length: 11 },
  { value: "FR", label: "France", dialCode: "+33", length: 9 },
  { value: "SG", label: "Singapore", dialCode: "+65", length: 8 },
];

const Step1MobileOTP = ({ data, updateData, nextStep }) => {
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);

  const handleCountryChange = (e) => {
    const selected = COUNTRY_OPTIONS.find(opt => opt.value === e.target.value);
    if (selected) {
      setCountry(selected);
      updateData({ mobile: '' });
    }
  };

  const handleMobileChange = (e) => {
    const mobile = e.target.value.replace(/\D/g, '').slice(0, country.length);
    updateData({ mobile });
    if (errors.mobile) {
      setErrors(prev => ({ ...prev, mobile: '' }));
    }
  };

  const handleOtpChange = (e) => {
    const otp = e.target.value.replace(/\D/g, '').slice(0, 6);
    updateData({ otp });
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const sendOTP = async () => {
    if (!data.mobile) {
      setErrors({ mobile: 'Mobile number is required' });
      return;
    }

    if (data.mobile.length !== country.length) {
      setErrors({ mobile: `Please enter a valid ${country.length}-digit mobile number` });
      return;
    }

    const fullMobile = `${country.dialCode}${data.mobile}`;

    setIsLoading(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      console.log('OTP sent to:', fullMobile);
      updateData({ fullMobile }); // Store full mobile with country code
      setOtpSent(true);
      setIsLoading(false);
      // In real app, OTP would be sent via SMS
      // For demo, we'll use a dummy OTP: 123456
    }, 1000);
  };

  const verifyOTP = () => {
    if (!data.otp) {
      setErrors({ otp: 'Please enter OTP' });
      return;
    }

    if (data.otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    // TODO: Replace with actual OTP verification API call
    // For demo, accept any 6-digit OTP
    if (data.otp.length === 6) {
      nextStep();
    } else {
      setErrors({ otp: 'Invalid OTP. Please try again.' });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        Verify Your Mobile Number
      </h2>

      <div className="space-y-4">
        {/* Country Code Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            value={country.value}
            onChange={handleCountryChange}
            disabled={otpSent}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white disabled:bg-gray-100"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.dialCode})
              </option>
            ))}
          </select>
        </div>

        {/* Mobile Number with Country Code */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 py-3 border border-r-0 border-gray-300 bg-gray-100 text-gray-700 rounded-l-lg font-medium">
              {country.dialCode}
            </span>
            <input
              type="tel"
              value={data.mobile}
              onChange={handleMobileChange}
              placeholder={`Enter ${country.length}-digit number`}
              disabled={otpSent}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            />
          </div>
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>

        {!otpSent ? (
          <PrimaryButton
            onClick={sendOTP}
            disabled={isLoading || !data.mobile}
            className="w-full"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </PrimaryButton>
        ) : (
          <>
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4">
              OTP sent to {country.dialCode} {data.mobile}. Please check your SMS.
            </div>
            <FormInput
              label="Enter OTP"
              type="tel"
              name="otp"
              value={data.otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit OTP"
              required
              error={errors.otp}
              maxLength={6}
            />
            <div className="flex gap-4">
              <PrimaryButton
                onClick={verifyOTP}
                disabled={!data.otp || data.otp.length !== 6}
                className="flex-1"
              >
                Verify OTP
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  setOtpSent(false);
                  updateData({ otp: '' });
                }}
                variant="outline"
                className="flex-1"
              >
                Change Number
              </PrimaryButton>
            </div>
          </>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-4 text-center">
        We'll use this number to send you donation receipt and updates
      </p>
    </div>
  );
};

export default Step1MobileOTP;

