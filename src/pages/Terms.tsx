import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Terms() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const sections = [
    { title: t('terms.s1_title', '1. Acceptance of Terms'), body: t('terms.s1_body', 'By accessing or using MedMate ("the Service"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you may not use the Service.') },
    { title: t('terms.s2_title', '2. Description of Service'), body: t('terms.s2_body', 'MedMate is an AI-powered health information platform designed to provide general health insights, symptom analysis, and wellness guidance. The Service is intended for informational purposes only and does not constitute medical advice, diagnosis, or treatment.') },
    { title: t('terms.s3_title', '3. Medical Disclaimer'), body: t('terms.s3_body', 'MedMate is not a medical device and does not provide professional medical advice. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition.') },
    { title: t('terms.s4_title', '4. User Accounts'), body: t('terms.s4_body', 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify MedMate of any unauthorized use.') },
    { title: t('terms.s5_title', '5. Acceptable Use'), body: t('terms.s5_body', 'You agree not to use the Service to upload harmful content, gain unauthorized access, use automated scraping tools, impersonate others, or violate applicable laws or regulations.') },
    { title: t('terms.s6_title', '6. Intellectual Property'), body: t('terms.s6_body', 'All content, trademarks, and intellectual property on the Service are owned by MedMate or its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.') },
    { title: t('terms.s7_title', '7. Limitation of Liability'), body: t('terms.s7_body', 'To the maximum extent permitted by law, MedMate shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.') },
    { title: t('terms.s8_title', '8. Termination'), body: t('terms.s8_body', 'We may terminate or suspend your account at any time, with or without cause or notice. Upon termination, your right to use the Service will immediately cease.') },
    { title: t('terms.s9_title', '9. Changes to Terms'), body: t('terms.s9_body', 'We reserve the right to modify these terms at any time. We will notify you of significant changes via email or a prominent notice on the Service.') },
    { title: t('terms.s10_title', '10. Governing Law'), body: t('terms.s10_body', 'These Terms shall be governed by and construed in accordance with applicable laws.') },
    { title: t('terms.s11_title', '11. Contact'), body: t('terms.s11_body', 'If you have any questions about these Terms, please contact us at rohillamanas06@gmail.com.') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
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
