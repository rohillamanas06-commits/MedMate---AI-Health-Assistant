import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <div className="min-h-screen">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="container max-w-3xl text-center space-y-4 animate-slide-up">
          <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Our Story
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
            About <span className="gradient-text">MedMate</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            The story behind why we built MedMate and where we're headed.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container max-w-3xl space-y-10 text-lg leading-relaxed text-muted-foreground">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
            <p>
              MedMate was born from the universal experience of uncertainty in health. We wanted to create a platform where anyone, anywhere, could get clear, calm, and trustworthy health information without fear or confusion. Our mission is to bridge the gap between medical knowledge and everyday access, making reliable guidance available to all.
            </p>
            <p>
              Healthcare is often complicated, inaccessible, and overwhelming. MedMate aims to simplify that journey. By leveraging advanced AI, we provide instant symptom analysis, ongoing health conversations, and guidance for finding care. Our goal is to empower users to make informed decisions and feel more confident about their health.
            </p>
            <p>
              We are committed to privacy, clarity, and compassion. MedMate is not a replacement for professional medical advice, but a companion for those moments when you need answers, reassurance, or a starting point. We believe everyone deserves access to quality health information, and we're working every day to make that a reality.
            </p>
            <p>
              Thank you for being part of our journey. If you have feedback or want to connect, we're always listening.
            </p>
          </div>
          <div className="pt-4 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link to="/contact">
                Get In Touch <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Start Using MedMate</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
