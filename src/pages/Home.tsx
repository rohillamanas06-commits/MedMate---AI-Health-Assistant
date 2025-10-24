import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Brain,
  MessageSquare,
  MapPin,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import heroImage from '@/assets/hero-medical.jpg';
import diagnosisIcon from '@/assets/diagnosis-icon.png';
import chatIcon from '@/assets/chat-icon.png';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: 'AI-Powered Diagnosis',
      description: 'Advanced AI analyzes your symptoms to provide accurate medical insights instantly.',
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: '24/7 Medical Assistant',
      description: 'Chat with our intelligent medical AI assistant anytime, anywhere.',
    },
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: 'Hospital Finder',
      description: 'Locate nearby hospitals and medical facilities with real-time information.',
    },
    {
      icon: <Shield className="h-12 w-12 text-primary" />,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security.',
    },
  ];

  const benefits = [
    'Instant symptom analysis with AI',
    'Medical image analysis',
    'Personalized health insights',
    'Track your medical history',
    'Voice-enabled interface',
    'Multi-language support',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container relative z-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  AI-Powered Healthcare
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Your Personal{' '}
                <span className="gradient-text">AI Medical</span> Assistant
              </h1>
              <p className="text-xl text-muted-foreground">
                Get instant AI-powered medical insights, diagnose symptoms, and connect with healthcare
                professionals - all in one intelligent platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="group"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                >
                  {user ? 'Go to Dashboard' : 'Get Started Free'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/diagnose')}>
                  Try Symptom Checker
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                    />
                  ))}
                </div>
                <div>
                  <p className="font-semibold">10,000+ Users</p>
                  <p className="text-sm text-muted-foreground">Trusted worldwide</p>
                </div>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <img
                src={heroImage}
                alt="AI Medical Assistant"
                className="relative rounded-3xl shadow-2xl hover-lift"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16 animate-slide-up">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Powerful Features for Your Health
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered healthcare tools at your fingertips
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

      {/* How It Works */}
      <section className="py-24">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold">How MedMate Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get medical assistance in three simple steps
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe Symptoms',
                description: 'Tell our AI about your symptoms or upload medical images',
                image: diagnosisIcon,
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Advanced algorithms analyze and provide detailed insights',
                image: chatIcon,
              },
              {
                step: '03',
                title: 'Get Results',
                description: 'Receive comprehensive diagnosis and recommended actions',
                image: diagnosisIcon,
              },
            ].map((step, index) => (
              <div key={index} className="relative group animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all"></div>
                <Card className="relative p-8 text-center space-y-4 hover-lift">
                  <div className="text-6xl font-bold text-primary/20">{step.step}</div>
                  <img src={step.image} alt={step.title} className="w-24 h-24 mx-auto" />
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Everything You Need for Better Health
              </h2>
              <p className="text-xl text-muted-foreground">
                MedMate combines cutting-edge AI with medical expertise to provide you with the best
                healthcare experience.
              </p>
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="mt-4" onClick={() => navigate(user ? '/dashboard' : '/auth')}>
                Start Your Journey
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Diagnoses', value: '50K+' },
                  { label: 'Accuracy', value: '98%' },
                  { label: 'Users', value: '10K+' },
                  { label: 'Countries', value: '50+' },
                ].map((stat, index) => (
                  <Card key={index} className="p-6 text-center hover-lift glass animate-pulse-glow">
                    <div className="text-4xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-muted-foreground mt-2">{stat.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-90"></div>
            <div className="relative z-10 p-12 lg:p-20 text-center text-white space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold">Ready to Transform Your Healthcare?</h2>
              <p className="text-xl max-w-2xl mx-auto opacity-90">
                Join thousands of users who trust MedMate for their health needs
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                >
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
