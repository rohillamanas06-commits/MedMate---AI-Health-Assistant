import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      <Link to="/" className="text-foreground hover:text-primary transition-colors">
        Home
      </Link>
      {user ? (
        <>
          <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/diagnose" className="text-foreground hover:text-primary transition-colors">
            Diagnosis
          </Link>
          <Link to="/chat" className="text-foreground hover:text-primary transition-colors">
            AI Chat
          </Link>
          <Link to="/hospitals" className="text-foreground hover:text-primary transition-colors">
            Find Hospitals
          </Link>
        </>
      ) : null}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
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
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button onClick={() => navigate('/auth')}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background">
            <div className="flex flex-col space-y-4 mt-8">
              <NavLinks />
              {user ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/auth')}>
                    Login
                  </Button>
                  <Button onClick={() => navigate('/auth')}>Get Started</Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
