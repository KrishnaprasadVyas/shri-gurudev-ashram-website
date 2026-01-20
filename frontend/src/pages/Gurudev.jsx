import SectionHeading from "../components/SectionHeading";

const Gurudev = () => {
  return (
    <>
      {/* Gurudev Profile Section - Spiritual & Elegant */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-50 via-orange-50/30 to-amber-50/50">
        <div className="max-w-4xl mx-auto">
          {/* Centered Profile Card */}
          <div className="flex flex-col items-center text-center">
            {/* Portrait Image */}
            <div className="relative mb-8">
              <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden shadow-xl ring-4 ring-amber-100">
                <img
                  src="/assets/gurudev.jpg"
                  alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Subtle decorative ring */}
              <div className="absolute inset-0 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border-2 border-amber-200/50 -m-1 pointer-events-none"></div>
            </div>

            {/* Name in Serif Font */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-4 leading-tight">
              Param Pujya Shri Swami
              <br />
              Harichaitanyanand Saraswatiji Maharaj
            </h1>

            {/* Thin Saffron Divider */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6"></div>

            {/* Short Description */}
            <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
              श्री गुरुदेव आश्रम (पलसखेड सपकाल, चिखली, बुलडाणा) और स्वामी
              हरिचैतन्य शान्ति आश्रम ट्रस्ट (दाताला, मलकापूर) के संस्थापक एवं
              आध्यात्मिक मार्गदर्शक
            </p>
          </div>
        </div>
      </section>

      {/* About Gurudev Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6 text-center text-lg leading-relaxed">
              Gurudev ji ने भक्ति, ज्ञान और निस्वार्थ सेवा को एक साथ जीने का
              मार्ग दिखाया है। आश्रम में दैनिक सत्संग, गीता पाठ, हरिपाठ,
              अन्नदान, शिक्षा, चिकित्सा, गौशाला, गुरुकुलम्, आदिवासी सेवा, अनाथ
              आश्रम और सेवा तीर्थ धाम के माध्यम से समाज की सेवा की जाती है।
            </p>
            <p className="text-gray-700 text-center text-lg leading-relaxed">
              हर सेवा कार्य का उद्देश्य मन की शुद्धि और समाज के उत्थान को साथ
              लेना है। Gurudev ji द्वारा प्रेरित शाखाएँ और सेवाएँ देश के अलग-अलग
              भागों में भक्तों को जोड़ती हैं।
            </p>
          </div>
        </div>
      </section>

      

      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-5xl mx-auto">
          <SectionHeading title="Teachings & Daily Sadhana" center={true} />
          <div className="space-y-6">
            {[
              {
                title: "Bhakti, Gyan, Seva",
                content:
                  "भक्ति रस से भरा सत्संग, श्रीमद्भगवद् गीता का अध्ययन और निस्वार्थ सेवा को एक ही साधना माना जाता है।",
              },
              {
                title: "स्मरण और जप",
                content:
                  "हरिपाठ, गीता पाठ और नामस्मरण को दिनचर्या का हिस्सा बनाना मन को स्थिर करता है।",
              },
              {
                title: "Atma Seva Through Lok Seva",
                content:
                  "अन्नदान, गुरुकुल, अनाथ आश्रम, गौशाला और चिकित्सा सेवा के माध्यम से समाज की सेवा ही आत्मसेवा है।",
              },
            ].map((teaching, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  {teaching.title}
                </h3>
                <p className="text-gray-700">{teaching.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div>
            <SectionHeading title="Daily Aarti & Darshan" center={false} />
            <div className="bg-amber-50 p-6 rounded-lg shadow-sm">
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>काकड़ा आरती - सुबह 4 बजे</li>
                <li>दैनिक सुबह आरती - सुबह 6 बजे</li>
                <li>हरिपाठ - शाम 6 बजे</li>
                <li>गीता पाठ - रात 8 बजे</li>
                <li>Darshan: 04:30 am - 01:00 pm, 04:30 pm - 09:00 pm</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                विशेष अवसरों पर समयांतर हो सकता है।
              </p>
            </div>
          </div>

          <div>
            <SectionHeading title="Ashram Branches" center={false} />
            <div className="bg-amber-50 p-6 rounded-lg shadow-sm space-y-2 text-gray-700">
              <p>श्री वैष्णवी गीता आश्रम, मालविहिर, जिला बुलडाणा</p>
              <p>
                श्री हरिचैतन्य शांति आश्रम, दाताला, तहसील मलकापूर, जिला बुलडाणा
              </p>
              <p>श्री गुरुदेव आश्रम, मुक्ताईनगर, जिला जलगांव</p>
              <p>श्री गुरुदेव आश्रम, कोथाला, तहसील मानवत, जिला परभणी</p>
              <p>श्री हरिचैतन्य गोधाम, शिंदी हराली, चिखली, जिला बुलढाणा</p>
              <p>श्री बालमुकुंद आश्रम, बेलगांव, कर्नाटक</p>
            </div>
          </div>
        </div>
        
      </section>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="Milestones" center={true} />
          <div className="mt-8">
            <ul className="relative border-l-2 border-amber-200">
              {[
                { year: "2010", event: "Foundation of Gurudev Ashram" },
                { year: "2012", event: "Launch of Annadan Seva Program" },
                { year: "2015", event: "Establishment of Educational Wing" },
                { year: "2017", event: "Inauguration of Medical Camp Services" },
                { year: "2020", event: "Expansion of Social Welfare Programs" },
                { year: "2024", event: "Reaching 10,000+ families through various initiatives" }
              ].map((m, idx) => (
                <li key={idx} className="mb-10 ml-6 relative">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-amber-600 rounded-full ring-8 ring-white"></span>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-amber-600 font-bold">{m.year}</div>
                    <div className="text-gray-700">{m.event}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

    </>
  );
};

export default Gurudev;
