import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const sections = [
    { title: t('privacy.s1_title', '1. Information We Collect'), body: t('privacy.s1_body', 'We collect information you provide when you create an account, use the Service, or contact us. This includes account info (name, email, password), health information you voluntarily submit, usage data, and device information.') },
    { title: t('privacy.s2_title', '2. How We Use Your Information'), body: t('privacy.s2_body', 'We use the information to provide and improve the Service, personalize your experience, send transactional emails, detect fraud, and comply with legal obligations. We do not use your health information for advertising.') },
    { title: t('privacy.s3_title', '3. Data Sharing & Disclosure'), body: t('privacy.s3_body', 'We do not sell, rent, or trade your personal information to third parties. We may share it with trusted service providers, when required by law, or in connection with a business transfer.') },
    { title: t('privacy.s4_title', '4. Data Security'), body: t('privacy.s4_body', 'We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 encryption in transit, access controls, and regular security audits.') },
    { title: t('privacy.s5_title', '5. Data Retention'), body: t('privacy.s5_body', 'We retain your personal data for as long as your account is active or as needed to provide the Service. You may request deletion of your account and data at any time.') },
    { title: t('privacy.s6_title', '6. Your Rights'), body: t('privacy.s6_body', 'Depending on your jurisdiction, you may have the right to access, correct, delete, or port your personal data. To exercise these rights, contact us at privacy@medmate.ai.') },
    { title: t('privacy.s7_title', '7. Cookies & Tracking'), body: t('privacy.s7_body', 'We use cookies and similar tracking technologies to maintain your session, remember preferences, and analyze usage patterns. You can control cookie settings through your browser.') },
    { title: t('privacy.s8_title', "8. Children's Privacy"), body: t('privacy.s8_body', 'The Service is not directed to individuals under 13. We do not knowingly collect personal information from children.') },
    { title: t('privacy.s9_title', '9. Third-Party Links'), body: t('privacy.s9_body', 'The Service may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.') },
    { title: t('privacy.s10_title', '10. Changes to This Policy'), body: t('privacy.s10_body', 'We may update this Privacy Policy from time to time and will notify you of material changes via email or a prominent notice on the Service.') },
    { title: t('privacy.s11_title', '11. Contact Us'), body: t('privacy.s11_body', 'If you have questions about this Privacy Policy, please contact us at rohillamanas06@gmail.com.') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 lg:py-24 flex-1">
        <div className="container max-w-3xl">
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
