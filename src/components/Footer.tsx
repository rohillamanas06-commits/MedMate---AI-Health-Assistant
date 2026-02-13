import { Rocket } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left - Copyright */}
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MedMate. All rights reserved.
          </div>
          {/* Right - Peerlist Badge */}
          <a
            href="https://peerlist.io/rohillamanas06/project/medmate"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300"
          >
            <img
              src="https://dqy38fnwh4fqs.cloudfront.net/website/project-spotlight/project-week-rank-one-dark.svg"
              alt="Peerlist Project of the Week"
              className="h-16 w-auto md:h-12"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
