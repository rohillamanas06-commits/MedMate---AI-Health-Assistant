import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const productLinks = [
    { labelKey: 'footer.symptom_checker', label: 'Symptom Checker', href: '/diagnose' },
    { labelKey: 'footer.ai_chat', label: 'AI Chat Assistant', href: '/chat' },
    { labelKey: 'footer.hospital_finder', label: 'Hospital Finder', href: '/hospitals' },
    { labelKey: 'footer.report_explainer', label: 'Lab Report Analyzer', href: '/explain' },
    { labelKey: 'footer.prescription_decoder', label: 'Prescription Decoder', href: '/handwriting' },
  ];

  const companyLinks = [
    { labelKey: 'footer.about_us', label: 'About Us', href: '/about' },
    { labelKey: 'footer.contact', label: 'Contact', href: '/contact' },
    { labelKey: 'footer.faq', label: 'FAQ', href: '/faq' },
  ];

  const legalLinks = [
    { labelKey: 'footer.privacy', label: 'Privacy Policy', href: '/privacy-policy' },
    { labelKey: 'footer.terms', label: 'Terms & Conditions', href: '/terms' },
  ];

  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="space-y-5 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Med<span className="text-primary">Mate</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footer.tagline', 'AI-powered health assistant that helps you understand your symptoms, find care, and take control of your wellbeing.')}
            </p>
            <div className="flex items-center gap-3">
              <a href="mailto:rohillamanas06@gmail.com" aria-label="Email"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <Mail className="h-4 w-4" />
              </a>
              <a href="https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/in/manas-rohilla-b73415338" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {t('footer.product', 'Product')}
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t(link.labelKey, link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {t('footer.company', 'Company')}
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t(link.labelKey, link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              {t('footer.legal', 'Legal')}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t(link.labelKey, link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left - Copyright */}
          <div className="text-sm text-muted-foreground">
            © 2026 MedMate. All rights reserved.
          </div>
          
          {/* Right - Peerlist Badge */}
          <div>
            <a href="https://peerlist.io/rohillamanas06/project/medmate" target="_blank" rel="noreferrer">
              <img
                src="https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-one-dark.svg"
                alt="MedMate"
                style={{ width: 'auto', height: '64px' }}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
