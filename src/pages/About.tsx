import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export default function About() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  return (
    <div className="min-h-screen">
      <section className="py-16 lg:py-24">
        <div className="container max-w-3xl space-y-10 text-lg leading-relaxed text-muted-foreground">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-foreground">{t('about.story_title', 'Our Story')}</h2>
            <p>{t('about.story_p1', 'MedMate was born from the universal experience of uncertainty in health. We wanted to create a platform where anyone, anywhere, could get clear, calm, and trustworthy health information without fear or confusion. Our mission is to bridge the gap between medical knowledge and everyday access, making reliable guidance available to all.')}</p>
            <p>{t('about.story_p2', 'Healthcare is often complicated, inaccessible, and overwhelming. MedMate aims to simplify that journey. By leveraging advanced AI, we provide instant symptom analysis, ongoing health conversations, and guidance for finding care. Our goal is to empower users to make informed decisions and feel more confident about their health.')}</p>
            <p>{t('about.story_p3', 'We are committed to privacy, clarity, and compassion. MedMate is not a replacement for professional medical advice, but a companion for those moments when you need answers, reassurance, or a starting point. We believe everyone deserves access to quality health information, and we\'re working every day to make that a reality.')}</p>
            <p>{t('about.story_p4', 'Thank you for being part of our journey. If you have feedback or want to connect, we\'re always listening.')}</p>
          </div>
          <div className="pt-4 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link to="/contact">{t('about.get_in_touch', 'Get In Touch')} <span className="ml-2">→</span></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">{t('about.start_using', 'Start Using MedMate')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
