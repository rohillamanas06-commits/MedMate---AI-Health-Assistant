import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, LogOut, User, Menu, Info, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CreditsBadge } from '@/components/CreditsBadge';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';
import { useState } from 'react';

export const Navbar = () => {
  const { user, logout, checkAuth, updateCredits } = useAuth();
  const { currentLanguage: language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleCreditsSuccess = async () => {
    await checkAuth();
  };

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'bn', label: 'Bengali (বাংলা)' },
    { code: 'ml', label: 'Malayalam (മലയാളം)' },
    { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsSheetOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsSheetOpen(false);
  };

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const linkClass = "text-foreground hover:text-primary transition-colors";

    if (isMobile) {
      return (
        <>
          <button onClick={() => handleNavigation('/')} className={`${linkClass} text-left w-full`}>
            {t('navbar.home')}
          </button>
          {user ? (
            <>
              <button onClick={() => handleNavigation('/dashboard')} className={`${linkClass} text-left w-full`}>
                {t('navbar.dashboard')}
              </button>
              <button onClick={() => handleNavigation('/diagnose')} className={`${linkClass} text-left w-full`}>
                {t('navbar.diagnose')}
              </button>
              <button onClick={() => handleNavigation('/chat')} className={`${linkClass} text-left w-full`}>
                {t('navbar.chat')}
              </button>
              <button onClick={() => handleNavigation('/explain')} className={`${linkClass} text-left w-full`}>
                {t('navbar.explain')}
              </button>
              <button onClick={() => handleNavigation('/hospitals')} className={`${linkClass} text-left w-full`}>
                {t('navbar.hospitals')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleNavigation('/about')} className={`${linkClass} text-left w-full`}>
                {t('navbar.about')}
              </button>
            </>
          )}
        </>
      );
    }

    return (
      <>
        <Link to="/" className={linkClass}>
          {t('navbar.home')}
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" className={linkClass}>
              {t('navbar.dashboard')}
            </Link>
            <Link to="/diagnose" className={linkClass}>
              {t('navbar.diagnose')}
            </Link>
            <Link to="/chat" className={linkClass}>
              {t('navbar.chat')}
            </Link>
            <Link to="/explain" className={linkClass}>
              {t('navbar.explain')}
            </Link>
            <Link to="/hospitals" className={linkClass}>
              {t('navbar.hospitals')}
            </Link>
          </>
        ) : (
          <>
            <Link to="/about" className={linkClass}>
              {t('navbar.about')}
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl gradient-text">MedMate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </div>

        {/* User Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
              <CreditsBadge
                credits={user.credits ?? 0}
                onClick={() => setShowBuyCredits(true)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    {t('navbar.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    {t('navbar.about')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Languages className="h-4 w-4 mr-2" />
                      {t('navbar.language')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {LANGUAGES.map(lang => (
                          <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}>
                            {lang.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowBuyCredits(true)}>
                    💳 Buy Credits
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('navbar.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                {t('navbar.login')}
              </Button>
              <Button onClick={() => navigate('/auth')}>{t('navbar.get_started')}</Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <div className="flex flex-col space-y-4 mt-8">
              <NavLinks isMobile={true} />
              {user ? (
                <>
                  <Button variant="outline" onClick={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    {t('navbar.profile')}
                  </Button>
                  <Button variant="outline" onClick={() => handleNavigation('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    {t('navbar.about')}
                  </Button>
                  <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-semibold flex items-center">
                      <Languages className="h-4 w-4 mr-2" />
                      {t('navbar.language')}
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {LANGUAGES.map(lang => (
                        <Button
                          key={lang.code}
                          variant={language === lang.code ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setLanguage(lang.code as any);
                            setIsSheetOpen(false);
                          }}
                        >
                          {lang.label.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('navbar.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { navigate('/auth'); setIsSheetOpen(false); }}>
                    {t('navbar.login')}
                  </Button>
                  <Button onClick={() => { navigate('/auth'); setIsSheetOpen(false); }}>{t('navbar.get_started')}</Button>
                  <Button variant="outline" onClick={() => handleNavigation('/about')}>
                    <Info className="h-4 w-4 mr-2" />
                    {t('navbar.about')}
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsSuccess}
        currentCredits={user?.credits ?? 0}
      />
    </nav>
  );
};
