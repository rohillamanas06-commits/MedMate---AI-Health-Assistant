const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using MedMate ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not use the Service. These terms apply to all visitors, users, and others who access the Service.`,
  },
  {
    title: '2. Description of Service',
    body: `MedMate is an AI-powered health information platform designed to provide general health insights, symptom analysis, and wellness guidance. The Service is intended for informational purposes only and does not constitute medical advice, diagnosis, or treatment.`,
  },
  {
    title: '3. Medical Disclaimer',
    body: `MedMate is not a medical device and does not provide professional medical advice. The information provided is for general informational purposes only. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided by the Service.`,
  },
  {
    title: '4. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify MedMate of any unauthorized use of your account. You must be at least 18 years of age, or have parental consent, to use the Service.`,
  },
  {
    title: '5. Credits & Payments',
    body: `Certain features of MedMate require credits. Credits purchased through the Service are non-refundable except where required by applicable law. Free monthly credits expire at the end of each billing cycle. We reserve the right to modify pricing at any time with reasonable notice to existing users.`,
  },
  {
    title: '6. Acceptable Use',
    body: `You agree not to use the Service to: (a) upload or transmit harmful, offensive, or illegal content; (b) attempt to gain unauthorized access to any part of the Service; (c) use automated tools to scrape or extract data; (d) impersonate another person or entity; (e) violate any applicable laws or regulations.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content, trademarks, and intellectual property on the Service are owned by MedMate or its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission. User-submitted content remains your property; by submitting it, you grant MedMate a license to use it to provide and improve the Service.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, MedMate shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim shall not exceed the amount paid by you to MedMate in the past 12 months.`,
  },
  {
    title: '9. Termination',
    body: `We may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease. All provisions that by their nature should survive termination shall survive.`,
  },
  {
    title: '10. Changes to Terms',
    body: `We reserve the right to modify these terms at any time. We will notify you of significant changes via email or a prominent notice on the Service. Continued use of the Service after changes constitutes your acceptance of the revised terms.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.`,
  },
  {
    title: '12. Contact',
    body: `If you have any questions about these Terms, please contact us at rohillamanas06@gmail.com.`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container text-center space-y-4 animate-slide-up">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Legal
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold">
            Terms &amp; <span className="gradient-text">Conditions</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Last updated: March 9, 2026
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using MedMate.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24 flex-1">
        <div className="container max-w-3xl">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
