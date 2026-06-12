import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register, user } = useAuth();

  // "login" or "register" mode based on query param or state
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Form status
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [registerStatus, setRegisterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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

  // Form states
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus("loading");
    try {
      await login(loginData.username, loginData.password);
      setLoginStatus("success");
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000); // Give time for success state to show
    } catch (error) {
      setLoginStatus("error");
      toast.error(error instanceof Error ? error.message : 'Login failed');
      setTimeout(() => setLoginStatus("idle"), 2000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.username.length < 3 || registerData.username.length > 20) {
      toast.error('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setRegisterStatus("loading");
    try {
      await register(registerData.username, registerData.email, registerData.password);
      setRegisterStatus("success");
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setRegisterStatus("error");
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      setTimeout(() => setRegisterStatus("idle"), 2000);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  return (
    <div className="min-h-[100dvh] w-full flex h-[100dvh] max-h-[100dvh] fixed inset-0 overflow-hidden bg-[#050505]">
      {/* Left Side - Medical Image */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-black items-center justify-center">
        {backgroundImages.length > 0 && (
          <>
            {backgroundImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Medical background ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
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

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-[#0a0a0a] text-white h-[100dvh] overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="mb-6 lg:mb-8">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-white/50 uppercase mb-2">
              {mode === 'login' ? 'Sign In' : 'Register'}
            </h2>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white/90">
              {mode === 'login' ? 'Your account' : 'New account'}
            </h1>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Username
                </Label>
                <Input
                  id="login-username"
                  placeholder=""
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold tracking-widest text-white/50 uppercase hover:text-white transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder=""
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="pt-4">
                <ActionButton
                  type="submit"
                  status={loginStatus}
                  successMessage="Welcome back!"
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  Sign In
                </ActionButton>
              </div>

              <div className="flex items-center justify-start mt-6 text-sm text-white/50">
                <span>No account? </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 text-white hover:underline underline-offset-4"
                >
                  Create one
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-username" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Name
                </Label>
                <Input
                  id="register-username"
                  placeholder=""
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Email
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder=""
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Password (Min 6)
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder=""
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm" className="text-[11px] font-semibold tracking-widest text-white/50 uppercase">
                  Confirm Password
                </Label>
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder=""
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-10 text-white focus-visible:ring-0 focus-visible:border-white focus-visible:ring-offset-0 transition-colors"
                />
              </div>

              <div className="pt-4">
                <ActionButton
                  type="submit"
                  status={registerStatus}
                  successMessage="Account Created!"
                  className="w-full bg-white text-black hover:bg-white/90 rounded-none h-14 text-[13px] font-semibold tracking-widest uppercase transition-all"
                >
                  Create Account
                </ActionButton>
              </div>

              <div className="flex items-center justify-start mt-6 text-sm text-white/50">
                <span>Already have one? </span>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="ml-2 text-white hover:underline underline-offset-4"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
