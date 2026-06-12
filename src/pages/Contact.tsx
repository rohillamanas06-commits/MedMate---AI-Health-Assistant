import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Contact() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t('contact.fill_required', 'Please fill in all required fields.'));
      return;
    }
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("success");
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setStatus("idle"), 2000);
  };

  const contactInfo = [
    { icon: <Mail className="h-5 w-5 text-primary" />, label: t('contact.email', 'Email'), value: 'rohillamanas06@gmail.com', href: 'mailto:rohillamanas06@gmail.com' },
    { icon: <Phone className="h-5 w-5 text-primary" />, label: t('contact.phone', 'Phone'), value: '+91 839-60-26-450', href: 'tel:+918396026450' },
    { icon: <MapPin className="h-5 w-5 text-primary" />, label: t('contact.location', 'Location'), value: 'Jaipur, India', href: null },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 lg:py-24 flex-1">
        <div className="container max-w-4xl mx-auto">
            <Card className="p-8 space-y-6 w-full">
              <h2 className="text-2xl font-bold">{t('contact.send_message', 'Send a message')}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.name', 'Name')} <span className="text-destructive">*</span></Label>
                    <Input id="name" name="name" placeholder={t('contact.name_placeholder', 'John Doe')} value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email', 'Email')} <span className="text-destructive">*</span></Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.subject', 'Subject')}</Label>
                  <Input id="subject" name="subject" placeholder={t('contact.subject_placeholder', 'How can we help?')} value={form.subject} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.message', 'Message')} <span className="text-destructive">*</span></Label>
                  <Textarea id="message" name="message" placeholder={t('contact.message_placeholder', 'Tell us more about your question or feedback...')} rows={6} value={form.message} onChange={handleChange} required />
                </div>
                <ActionButton 
                  type="submit" 
                  className="w-full" 
                  status={status}
                  successMessage={t('contact.sent_success', "Message sent!")}
                >
                  {t('contact.send', 'Send Message')}
                </ActionButton>
              </form>
            </Card>
        </div>
      </section>
    </div>
  );
}
