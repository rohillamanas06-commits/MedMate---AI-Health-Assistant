import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    // Simulated send — replace with real API call if needed
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.success('Message sent! We\'ll get back to you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5 text-primary" />,
      label: 'Email',
      value: 'rohillamanas06@gmail.com',
      href: 'mailto:rohillamanas06@gmail.com',
    },
    {
      icon: <Phone className="h-5 w-5 text-primary" />,
      label: 'Phone',
      value: '+91 839-60-26-450',
      href: 'tel:+918396026450',
    },
    {
      icon: <MapPin className="h-5 w-5 text-primary" />,
      label: 'Location',
      value: 'Jaipur , India',
      href: null,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container text-center space-y-4 animate-slide-up">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Get In Touch
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold">
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question, feedback, or just want to say hello? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24 flex-1">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 items-start">

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Let's talk</h2>
                <p className="text-muted-foreground">
                  Our team is here to help you with any questions about MedMate.
                </p>
              </div>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <Card key={item.label} className="p-4 flex items-center gap-4 hover-lift">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a href={item.href} className="font-medium hover:text-primary transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium">{item.value}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-3 p-8 space-y-6">
              <h2 className="text-2xl font-bold">Send a message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="How can we help?"
                    value={form.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your question or feedback..."
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : (
                    <>
                      Send Message <Send className="ml-2 h-4 w-4" />
                    </>
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
