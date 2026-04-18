import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Brain,
  MessageSquare,
  MapPin,
  ArrowRight,
  FileText,
  FileImage,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Footer } from '@/components/Footer';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: 'AI Diagnosis',
      description: 'AI analyzes your symptoms and provides accurate medical insights instantly.',
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: 'AI Chat',
      description: 'Chat with our intelligent medical AI assistant anytime, anywhere.',
    },
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: 'Hospital Finder',
      description: 'Locate nearby hospitals and medical facilities with real-time information.',
    },
    {
      icon: <FileText className="h-12 w-12 text-primary" />,
      title: 'Report Analyzer',
      description: 'Upload complex medical reports for simple, AI-driven explanations.',
    },
    {
      icon: <FileImage className="h-12 w-12 text-primary" />,
      title: 'Prescription Decoder',
      description: 'Analyze handwritten prescriptions and medical notes with AI.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background h-screen">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative h-full w-full">
          <img
            src="/yaser-mobarakabadi-aHDgLfd4Wnc-unsplash.jpg"
            alt="AI Medical Assistant"
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          />
        </div>
      </section>







      <Footer />

    </div>
  );
}
