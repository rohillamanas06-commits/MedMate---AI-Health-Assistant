import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

interface CreditsBadgeProps {
  credits: number | null;
  onClick?: () => void;
  className?: string;
}

export function CreditsBadge({ credits, onClick, className = '' }: CreditsBadgeProps) {
  const [displayCredits, setDisplayCredits] = useState(credits);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (credits !== displayCredits) {
      setAnimate(true);
      const timer = setTimeout(() => {
        setDisplayCredits(credits);
        setAnimate(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [credits]);

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 cursor-pointer hover:bg-yellow-50 transition-colors ${className} ${
        animate ? 'animate-pulse' : ''
      }`}
      onClick={onClick}
    >
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="font-semibold">{displayCredits ?? 0}</span>
    </Badge>
  );
}
