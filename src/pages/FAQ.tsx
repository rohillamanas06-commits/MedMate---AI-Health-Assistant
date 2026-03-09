import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
const faqs = [
  {
    category: 'General',
    items: [
      {
        q: 'What is MedMate?',
        a: 'MedMate is an AI-powered health assistant that helps you understand symptoms, get preliminary medical insights, find nearby hospitals, and chat with an intelligent medical assistant — all in one secure platform.',
      },
      {
        q: 'Is MedMate a replacement for seeing a doctor?',
        a: 'No. MedMate provides informational guidance and AI-generated insights, but it is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.',
      },
      {
        q: 'How do I get started?',
        a: 'Simply create a free account, then use the Symptom Checker, AI Chat, or Hospital Finder from your dashboard. No subscription is required to get started.',
      },
    ],
  },
  {
    category: 'AI & Accuracy',
    items: [
      {
        q: 'How accurate is the AI diagnosis?',
        a: 'Our AI is trained on extensive medical literature and is continuously updated. While it provides highly relevant insights, it is intended as a preliminary guide and should not replace a professional clinical evaluation.',
      },
      {
        q: 'What AI model does MedMate use?',
        a: 'MedMate uses state-of-the-art large language models fine-tuned on medical data, combined with retrieval-augmented generation to provide up-to-date, contextually accurate responses.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        q: 'Is my health data safe?',
        a: 'Absolutely. All data is encrypted in transit and at rest using industry-standard AES-256 encryption. We never sell your data to third parties. Please review our Privacy Policy for full details.',
      },
      {
        q: 'Who can see my health information?',
        a: 'Only you can access your personal health data. Our support team may access anonymized diagnostic logs solely for improving the service, and only with your explicit consent.',
      },
      {
        q: 'Can I delete my account and data?',
        a: 'Yes. You can request full deletion of your account and all associated data at any time from the Settings page or by contacting our support team.',
      },
    ],
  },
  {
    category: 'Credits & Billing',
    items: [
      {
        q: 'What are credits?',
        a: 'Credits are used to access premium AI features like in-depth diagnoses and extended chat sessions. Free accounts receive a monthly credit allowance.',
      },
      {
        q: 'How do I get more credits?',
        a: 'You can purchase additional credit packs at any time from the Buy Credits section in your dashboard. We support secure payment via Stripe.',
      },
      {
        q: 'Do unused credits expire?',
        a: 'Purchased credits never expire. Free monthly credits reset at the start of each billing cycle.',
      },
    ],
  },
];

export default function FAQ() {
  const [search, setSearch] = useState('');

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
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container text-center space-y-6 animate-slide-up">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Help Center
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about MedMate's features, privacy, and more.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 flex-1">
        <div className="container max-w-3xl">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No results found for "{search}". Try a different keyword.
            </p>
          ) : (
            <div className="space-y-10">
              {filtered.map((section) => (
                <div key={section.category}>
                  <h2 className="text-lg font-semibold text-primary mb-4 uppercase tracking-wider">
                    {section.category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {section.items.map((item, i) => (
                      <AccordionItem
                        key={i}
                        value={`${section.category}-${i}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left font-medium hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
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
