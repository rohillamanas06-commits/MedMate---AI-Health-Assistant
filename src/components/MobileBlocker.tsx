import { useState, useEffect, useRef } from 'react';
import { MonitorX, Smartphone } from 'lucide-react';

export function MobileBlocker({ children }: { children?: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isMobileHardware = 'ontouchstart' in window && window.screen.width <= 768;
    return isMobileUA || isMobileHardware;
  });
  const animRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isMobileHardware = typeof window !== 'undefined' && 'ontouchstart' in window && window.screen.width <= 768;
      setIsMobile(isMobileUA || isMobileHardware);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobile]);

  if (!isMobile) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-white text-black"
      style={{ touchAction: 'none' }}
    >
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3 font-sans">
          Desktop Only
        </h1>
        <p className="text-base max-w-[280px] mx-auto leading-relaxed text-gray-800">
          MedMate's interface is optimized exclusively for desktop screens. Please visit us on a computer.
        </p>
      </div>
    </div>
  );
}