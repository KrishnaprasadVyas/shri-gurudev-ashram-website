import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Left Column - Aartis and Discourses */}
          <div className="bg-gray-200 text-slate-950 overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col gap-6">
            <h3 className="text-2xl font-semibold text-amber-500 text-center tracking-wide">
              AARTIS AND DISCOURSES
            </h3>
            <div className="space-y-3 text-base 90">
              <p>काकड़ा आरती - सुबह 4 बजे</p>
              <p>दैनिक सुबह आरती - सुबह 6 बजे</p>
              <p>प्रातः भोजन</p>
              <p>मध्याह्न भोजन</p>
              <p>हरिपाठ - शाम 6 बजे</p>
              <p>रात्रि भोजन</p>
              <p>गीता पाठ - रात 8 बजे</p>
            </div>
            <div className="space-y-2 text-left  text-slate-950">
              <h4 className="text-lg font-semibold text-amber-300">
                Darshan Timings
              </h4>
              <p className="text-base">04:30 am to 01:00 pm</p>
              <p className="text-base">04:30 pm to 09:00 pm</p>
            </div>
            <p className="text-sm italic">
              Temple timings may be changed on special occasions.
            </p>
          </div>

          {/* Middle Column - Ashram Information */}
          <div className=" text-slate-950 overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col gap-6 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-500 mb-4">
                Shri Gurudev Ashram
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  श्री गुरुदेव आश्रम, पलसखेड सपकाल, तहसील चिखली, जिला बुलडाणा,
                  महाराष्ट्र - 443001
                </p>
                <p>
                  स्वामी हरिचैतन्य शान्ति आश्रम ट्रस्ट, दाताला, तहसील मलकापूर,
                  जिला बुलडाणा - 443102
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-amber-500 mb-4">
                FOLLOW US
              </h3>
              <div className="flex justify-center space-x-3">
                <a
                  href="https://www.facebook.com/SwamiHarichaitanyanandS/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@shrigurudevashram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/swami_harichaitanyaji_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/Harichaitanyaji"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-black rounded-md hover:bg-gray-800 transition-colors"
                  aria-label="Twitter/X"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                @swamiharichaitanyanands
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>मो.</strong> 9158740007, 9834151577
              </p>
              <p>
                <strong>Website:</strong> www.shrigurudevashram.org
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:info@shrigurudevashram.org"
                  className="text-amber-600 hover:underline"
                >
                  info@shrigurudevashram.org
                </a>
                ,{" "}
                <a
                  href="mailto:info@shantiashramtrust.org"
                  className="text-amber-600 hover:underline"
                >
                  info@shantiashramtrust.org
                </a>
              </p>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>Dedicated to Param Pujya Shri Swami</p>
              <p>Harichaitanyanand Saraswatiji Maharaj</p>
            </div>
          </div>

          {/* Right Column - Sunday Schedule / Ashram Branches */}
          <div className="bg-gray-200 text-slate-950 overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-amber-700 mb-4">
              आश्रम की शाखाएँ
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>श्री वैष्णवी गीता आश्रम, मालविहिर, जिला बुलडाणा</p>
              <p>
                श्री हरिचैतन्य शांति आश्रम, दाताला, तहसील मलकापूर, जिला बुलडाणा
              </p>
              <p>श्री गुरुदेव आश्रम, मुक्ताईनगर, जिला जलगांव</p>
              <p>श्री गुरुदेव आश्रम, कोथाला, तहसील मानवत, जिला परभणी</p>
              <p>श्री हरिचैतन्य गोधाम, शिंदी हराली, चिखली, जिला बुलढाणा</p>
              <p>श्री बालमुकुंद आश्रम, बेलगांव, कर्नाटक</p>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-amber-700 mb-2">
                Bank Account Details
              </h4>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <p className="font-semibold">Shri Gurudev Ashram</p>
                  <p>State Bank of India</p>
                  <p>A/c No: 32035015646</p>
                  <p>IFSC: SBIN0008409</p>
                  <p>Branch: Shelsur</p>
                </div>
                <div className="mt-3">
                  <p className="font-semibold">
                    Swami Hari Chaitanya Shanti Ashram Trust
                  </p>
                  <p>HDFC Bank</p>
                  <p>A/c: 50200089955981</p>
                  <p>IFSC: HDFC0002489</p>
                  <p>Branch: Buldhana</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  आयकर अधिनियम 1961 की धारा 80G के अन्तर्गत आयकर छूट के लिए
                  मान्य।
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>
            &copy; {currentYear} Shri Gurudev Ashram, Palaskhed Sapkal. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
