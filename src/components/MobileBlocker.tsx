import { useState, useEffect } from 'react';
import { MonitorX, Smartphone } from 'lucide-react';

export function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      // Check physical screen size to catch "Desktop site" mode on mobile browsers
      const isSmallScreen = window.screen.width <= 768 || window.screen.height <= 768;
      
      // Many mobile browsers in desktop mode spoof UA but still have maxTouchPoints and small physical screens
      const isMobileHardware = typeof window !== 'undefined' && 'ontouchstart' in window && isSmallScreen;

      if (isMobileUA || isSmallScreen || isMobileHardware) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-black border border-white/10 p-6 rounded-full flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-white/50 absolute animate-ping opacity-75" />
            <MonitorX className="w-12 h-12 text-white relative z-10" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white/90 mb-4 font-bold">
          Desktop Only
        </h1>
        
        <p className="text-white/60 text-lg max-w-[300px] mx-auto leading-relaxed mb-8">
          MedMate's advanced AI interface is optimized exclusively for desktop screens. Please visit us on a computer.
        </p>

        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
            Mobile Access Blocked
          </span>
        </div>
      </div>
    </div>
  );
}
