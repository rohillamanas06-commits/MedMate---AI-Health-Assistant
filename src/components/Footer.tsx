import { Link } from 'react-router-dom';
import { Mail, Github, Linkedin, Heart, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const productLinks = [
  { label: 'Symptom Checker', href: '/diagnose' },
  { label: 'AI Chat Assistant', href: '/chat' },
  { label: 'Hospital Finder', href: '/hospitals' },
];

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

export function Footer() {
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
              AI-powered health assistant that helps you understand your symptoms, find care, and
              take control of your wellbeing.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:rohillamanas06@gmail.com"
                aria-label="Email"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/manas-rohilla-b73415338"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center justify-center w-9 h-9 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              Product
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()} MedMate. All rights reserved.
          </p>
          <a
            href="https://peerlist.io/rohillamanas06/project/medmate"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-one-dark.svg"
              alt="Peerlist #1 Project of the Week"
              className="h-12 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
