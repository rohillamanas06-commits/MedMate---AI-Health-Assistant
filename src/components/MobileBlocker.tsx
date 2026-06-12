import { useState, useEffect, useRef } from 'react';
import { MonitorX, Smartphone } from 'lucide-react';

export function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);
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

  if (!isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
      style={{ background: '#0D0F14', touchAction: 'none' }}
    >
      {/* bg glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ECG line */}
      <div className="relative w-full max-w-[320px] h-[52px] mb-8">
        <svg width="100%" height="52" viewBox="0 0 320 52" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 26 L60 26 L72 26 L76 10 L82 42 L88 10 L94 42 L98 26 L110 26 L320 26"
            fill="none"
            stroke="#00C896"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
          />
          <circle r="3" fill="#00C896" ref={animRef}>
            <animateMotion
              path="M0 0 L60 0 L72 0 L76 -16 L82 16 L88 -16 L94 16 L98 0 L110 0 L320 0"
              dur="2.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;1;1;0"
              keyTimes="0;0.05;0.8;0.95;1"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* icon */}
        <div
          className="relative flex items-center justify-center rounded-full mb-5"
          style={{
            width: 80,
            height: 80,
            background: '#141820',
            border: '1px solid rgba(0,200,150,0.2)',
          }}
        >
          <Smartphone className="absolute w-7 h-7" style={{ color: 'rgba(0,200,150,0.4)' }} />
          <MonitorX className="relative z-10 w-7 h-7" style={{ color: '#00C896' }} />
        </div>

        <h1
          className="text-3xl font-bold tracking-tight mb-3"
          style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Inter, sans-serif' }}
        >
          Desktop Only
        </h1>

        <p
          className="text-base max-w-[280px] mx-auto leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          MedMate's advanced AI interface is optimized exclusively for desktop screens. Please visit us on a computer.
        </p>
      </div>
    </div>
  );
}