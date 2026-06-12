import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ActionButton } from '@/components/ui/action-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailSent, setEmailSent] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Fetch medical images from public folder
  useEffect(() => {
    const fetchMedicalImages = async () => {
      try {
        const imageUrls: string[] = [
          '/r1.jpg',
          '/r2.jpg',
          '/r3.jpg',
        ];
        
        setBackgroundImages(imageUrls);
        setImagesLoading(false);
      } catch (error) {
        console.error('Failed to load images:', error);
        setImagesLoading(false);
      }
    };

    fetchMedicalImages();
  }, []);

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    if (backgroundImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await api.forgotPassword(email);
      setStatus("success");
      setTimeout(() => {
        setEmailSent(true);
        setStatus("idle");
      }, 1000);
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex h-screen max-h-screen fixed inset-0 overflow-hidden bg-[#050505]">
      {/* Left Side - Medical Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black items-center justify-center">
        {backgroundImages.length > 0 && (
          <>
            {backgroundImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Medical background ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading="eager"
              />
            ))}
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

        {imagesLoading && backgroundImages.length === 0 && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-white/50" />
          </div>
        )}
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#0a0a0a] text-white h-screen overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-6 lg:mb-8">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-2">
              Recovery
            </h2>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white/90">
              Forgot Password
            </h1>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder=""
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <ActionButton 
                  type="submit" 
                  status={status}
                  successMessage="Email Sent!"
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  Send Reset Link
                </ActionButton>
              </div>

              <div className="flex items-center justify-start mt-6 text-sm text-white/50">
                <Link
                  to="/auth"
                  className="text-white hover:underline underline-offset-4"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4 text-white/70">
                <p>
                  We've sent password reset instructions to <strong className="text-white">{email}</strong>
                </p>
                <p className="text-sm">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>

              <div className="pt-4 space-y-4">
                <Button 
                  onClick={() => setEmailSent(false)} 
                  variant="outline" 
                  className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  Try Another Email
                </Button>
              </div>

              <div className="flex items-center justify-start mt-6 text-sm text-white/50">
                <Link
                  to="/auth"
                  className="text-white hover:underline underline-offset-4"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

