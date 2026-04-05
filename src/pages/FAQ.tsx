import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQ() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [search, setSearch] = useState('');

  const faqs = [
    {
      category: t('faq.cat_general', 'General'),
      items: [
        { q: t('faq.q1', 'What is MedMate?'), a: t('faq.a1', 'MedMate is an AI-powered health assistant that helps you understand symptoms, get preliminary medical insights, find nearby hospitals, and chat with an intelligent medical assistant — all in one secure platform.') },
        { q: t('faq.q2', 'Is MedMate a replacement for seeing a doctor?'), a: t('faq.a2', 'No. MedMate provides informational guidance and AI-generated insights, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.') },
        { q: t('faq.q3', 'How do I get started?'), a: t('faq.a3', 'Simply create a free account, then use the Symptom Checker, AI Chat, or Hospital Finder from your dashboard. No subscription is required to get started.') },
      ],
    },
    {
      category: t('faq.cat_ai', 'AI & Accuracy'),
      items: [
        { q: t('faq.q4', 'How accurate is the AI diagnosis?'), a: t('faq.a4', 'Our AI is trained on extensive medical literature and is continuously updated. While it provides highly relevant insights, it is intended as a preliminary guide and should not replace a professional clinical evaluation.') },
        { q: t('faq.q5', 'What AI model does MedMate use?'), a: t('faq.a5', 'MedMate uses state-of-the-art large language models fine-tuned on medical data, combined with retrieval-augmented generation to provide up-to-date, contextually accurate responses.') },
      ],
    },
    {
      category: t('faq.cat_privacy', 'Privacy & Security'),
      items: [
        { q: t('faq.q6', 'Is my health data safe?'), a: t('faq.a6', 'Absolutely. All data is encrypted in transit and at rest using industry-standard AES-256 encryption. We never sell your data to third parties. Please review our Privacy Policy for full details.') },
        { q: t('faq.q7', 'Who can see my health information?'), a: t('faq.a7', 'Only you can access your personal health data. Our support team may access anonymized diagnostic logs solely for improving the service, and only with your explicit consent.') },
        { q: t('faq.q8', 'Can I delete my account and data?'), a: t('faq.a8', 'Yes. You can request full deletion of your account and all associated data at any time by contacting our support team.') },
      ],
    },
  ];

  const filtered = faqs
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 lg:py-24 flex-1">
        <div className="container max-w-3xl">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t('faq.no_results', 'No results found for')} "{search}". {t('faq.try_keyword', 'Try a different keyword.')}
            </p>
          ) : (
            <div className="space-y-10">
              {filtered.map((section) => (
                <div key={section.category}>
                  <h2 className="text-lg font-semibold text-foreground mb-4 uppercase tracking-wider">
                    {section.category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} value={`${section.category}-${i}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left font-medium hover:no-underline">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
