import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t('contact.fill_required', 'Please fill in all required fields.'));
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.success(t('contact.sent_success', "Message sent! We'll get back to you soon."));
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: <Mail className="h-5 w-5 text-primary" />, label: t('contact.email', 'Email'), value: 'rohillamanas06@gmail.com', href: 'mailto:rohillamanas06@gmail.com' },
    { icon: <Phone className="h-5 w-5 text-primary" />, label: t('contact.phone', 'Phone'), value: '+91 839-60-26-450', href: 'tel:+918396026450' },
    { icon: <MapPin className="h-5 w-5 text-primary" />, label: t('contact.location', 'Location'), value: 'Jaipur, India', href: null },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-16 lg:py-24 flex-1">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('contact.lets_talk', "Let's talk")}</h2>
                <p className="text-muted-foreground">{t('contact.team_help', 'Our team is here to help you with any questions about MedMate.')}</p>
              </div>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <Card key={item.label} className="p-4 flex items-center gap-4 hover-lift">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">{item.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="font-medium hover:text-primary transition-colors">{item.value}</a>
                      ) : (
                        <p className="font-medium">{item.value}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="lg:col-span-3 p-8 space-y-6">
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('contact.sending', 'Sending...') : (
                    <>{t('contact.send', 'Send Message')} <Send className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
