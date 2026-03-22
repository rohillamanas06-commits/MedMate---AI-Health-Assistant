import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Brain,
  MessageSquare,
  MapPin,
  Shield,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import heroImage from '@/assets/hero-medical.jpg';
import diagnosisIcon from '@/assets/diagnosis-icon.png';
import chatIcon from '@/assets/chat-icon.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Medical images for carousel - Original girl image + 3 realistic medical images
  const medicalImages = [
    heroImage, // Original medical girl image
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&auto=format&fit=crop', // Healthcare professionals
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop', // Medical team working
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop', // Dental care
  ];

  // Auto-rotate images every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === medicalImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [medicalImages.length]);

  const features = [
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: t('home.feature_diagnosis_title'),
      description: t('home.feature_diagnosis_desc'),
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: t('home.feature_chat_title'),
      description: t('home.feature_chat_desc'),
    },
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: t('home.feature_hospitals_title'),
      description: t('home.feature_hospitals_desc'),
    },
    {
      icon: <FileText className="h-12 w-12 text-primary" />,
      title: t('home.feature_report_title'),
      description: t('home.feature_report_desc'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container relative z-10 py-8 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-slide-up">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {t('home.badge')}
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {t('home.title_start')} <br className="hidden lg:block" />
                <span className="text-primary">{t('home.title_highlight')}</span> {t('home.title_end')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('home.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="group"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                >
                  {user ? t('home.go_dashboard') : t('navbar.login')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/diagnose')}>
                  {t('home.try_symptom')}
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in overflow-hidden rounded-3xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse"></div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl group">
                <img
                  src={medicalImages[1]}
                  alt="AI Medical Assistant"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Divider */}
      <div className="relative h-px w-full bg-border/30">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      </div>

      {/* Features Grid */}
      <section className="py-8 sm:py-16 lg:py-24 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16 animate-slide-up">
            <h2 className="text-4xl lg:text-5xl font-bold">
              {t('home.features_title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.features_sub')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover-lift glass border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative h-px w-full bg-border/30">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      </div>

      {/* How It Works */}
      <section className="py-8 sm:py-16 lg:py-24 bg-gradient-to-tr from-accent/5 via-primary/5 to-background">
        <div className="container">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">{t('home.how_works_title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.how_works_sub')}
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: t('home.how_works_step1'),
                description: t('home.how_works_step1_desc'),
                image: diagnosisIcon,
              },
              {
                step: '02',
                title: t('home.how_works_step2'),
                description: t('home.how_works_step2_desc'),
                image: chatIcon,
              },
              {
                step: '03',
                title: t('home.how_works_step3'),
                description: t('home.how_works_step3_desc'),
                icon: (
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#1034a6] to-[#0a1f6a] rounded-xl flex items-center justify-center relative overflow-hidden shadow-xl shadow-blue-500/20 border-2 border-white/10">
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <FileText className="w-10 h-10 text-white relative z-10" strokeWidth={1.5} />
                  </div>
                ),
              },
            ].map((step, index) => (
              <div key={index} className="relative group animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all"></div>
                <Card className="relative p-8 text-center space-y-4 hover-lift">
                  <div className="text-6xl font-bold text-primary/20">{step.step}</div>
                  {step.image ? (
                    <img src={step.image} alt={step.title} className="w-24 h-24 mx-auto" />
                  ) : (
                    step.icon
                  )}
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Divider */}
      <div className="relative h-px w-full bg-border/30">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      </div>

      {/* Benefits */}
      <section className="py-8 sm:py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-t border-border/40">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 animate-slide-up">
              <h2 className="text-4xl lg:text-5xl font-bold">
                {t('home.why_title')}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('home.why_subtitle')}
              </p>
            </div>
            <div className="relative">
              <Card className="p-8 glass hover-lift animate-fade-in">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Brain className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold">{t('home.why_reason1_title')}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('home.why_reason1_desc')}
                  </p>
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <h3 className="text-2xl font-semibold">{t('home.why_reason2_title')}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('home.why_reason2_desc')}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
