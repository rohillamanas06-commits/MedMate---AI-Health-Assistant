import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Fetch medical images
  useEffect(() => {
    const fetchMedicalImages = async () => {
      try {
        const imageUrls: string[] = ['/r1.jpg', '/r2.jpg', '/r3.jpg'];
        setBackgroundImages(imageUrls);
        setImagesLoading(false);
      } catch (error) {
        console.error('Failed to load images:', error);
        setImagesLoading(false);
      }
    };
    fetchMedicalImages();
  }, []);

  // Auto-rotate images
  useEffect(() => {
    if (backgroundImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages]);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setTokenValid(false);
      setVerifying(false);
      return;
    }
    try {
      const result: any = await api.verifyResetToken(token);
      setTokenValid(result.valid);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      toast.success('Password reset successful!');
      navigate('/auth');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setLoading(false);
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
              Reset Password
            </h1>
          </div>

          {verifying ? (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              <p className="text-white/50 text-sm tracking-widest uppercase">Verifying link...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-6">
              <div className="flex flex-col space-y-4 text-white/70">
                <div className="rounded-full bg-red-500/10 p-3 w-fit">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="text-xl font-serif text-white">Invalid or Expired Link</h2>
                <p className="text-sm">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/forgot-password')} 
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  Request New Link
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  New Password (Min 6)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder=""
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-2">Passwords do not match</p>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

