import { title } from "process";

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly to us when you create an account, use the Service, or contact us. This includes:
• Account information: name, email address, and password.
• Health information: symptoms, chat messages, and diagnostic inputs you voluntarily submit.
• Usage data: pages visited, features used, and session duration, collected automatically.
• Device information: IP address, browser type, operating system, and device identifiers.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:
• Provide, maintain, and improve the Service.
• Personalize your experience and deliver relevant health insights.
• Send transactional emails such as account confirmations and password resets.
• Detect, investigate, and prevent fraudulent or unauthorized activity.
• Comply with legal obligations.
We do not use your health information for advertising purposes.`,
  },
  {
    title: '3. Data Sharing & Disclosure',
    body: `We do not sell, rent, or trade your personal information to third parties. We may share information with:
• Service providers: trusted vendors (e.g., hosting, analytics) who assist in operating the Service under strict confidentiality agreements.
• Legal requirements: when required by law, court order, or government authority.
• Business transfers: in connection with a merger, acquisition, or sale of assets, with user notification.`,
  },
  {
    title: '4. Data Security',
    body: `We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 encryption in transit, access controls, and regular security audits. While we strive to protect your data, no method of transmission over the internet is 100% secure.`,
  },
  {
    title: '5. Data Retention',
    body: `We retain your personal data for as long as your account is active or as needed to provide you with the Service. You may request deletion of your account and data at any time. Some data may be retained in anonymized form for analytical purposes.`,
  },
  {
    title: '6. Your Rights',
    body: `Depending on your jurisdiction, you may have the right to:
• Access the personal data we hold about you.
• Correct inaccurate or incomplete data.
• Request deletion of your personal data.
• Object to or restrict certain processing.
• Data portability — receive your data in a structured, machine-readable format.
To exercise these rights, contact us at privacy@medmate.ai.`,
  },
  {
    title: '7. Cookies & Tracking',
    body: `We use cookies and similar tracking technologies to maintain your session, remember preferences, and analyze usage patterns. You can control cookie settings through your browser. Disabling cookies may affect some functionality of the Service.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `The Service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will delete it promptly.`,
  },
  {
    title: '9. Third-Party Links',
    body: `The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the revised policy.`,
  },
  {
    title: '11. Contact Us',
    body: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us at rohillamanas06@gmail.com.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container text-center space-y-4 animate-slide-up">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Legal
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Last updated: March 9, 2026
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your privacy matters to us. This policy explains what data we collect, how we use it,
            and the rights you have.
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
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
