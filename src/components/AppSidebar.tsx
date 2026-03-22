import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Activity,
  Brain,
  MessageSquare,
  FileText,
  MapPin,
  Home,
  Info,
  LogOut,
  User,
  Settings,
  Languages,
  Clock,
  ChevronLeft
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "react-i18next"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { useLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentLanguage: language, setLanguage } = useLanguage()
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar()
  const [showMobileLanguages, setShowMobileLanguages] = useState(false)

  // Helper function to close sidebar only on mobile
  const closeOnMobile = () => {
    if (isMobile || window.innerWidth < 768) { // md breakpoint
      setOpenMobile(false)
    }
  }

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
    closeOnMobile();
  };

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    {
      title: t('navbar.home'),
      url: "/",
      icon: Home,
      public: true,
    },
    {
      title: t('navbar.dashboard'),
      url: "/dashboard",
      icon: Activity,
      public: false,
    },
    {
      title: t('navbar.diagnose'),
      url: "/diagnose",
      icon: Brain,
      public: false,
    },
    {
      title: t('navbar.chat'),
      url: "/chat",
      icon: MessageSquare,
      public: false,
    },
    {
      title: t('navbar.explain'),
      url: "/explain",
      icon: FileText,
      public: false,
    },
    {
      title: t('navbar.hospitals'),
      url: "/hospitals",
      icon: MapPin,
      public: false,
    },
    {
      title: t('navbar.history'),
      url: "/history",
      icon: Clock,
      public: false,
    },
    {
      title: t('navbar.about'),
      url: "/about",
      icon: Info,
      public: true,
    },
  ]

  const filteredItems = navItems.filter(item => item.public || user)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className={`flex items-center gap-2 p-2 ${!isMobile && state === "collapsed" ? "justify-center" : ""}`}>
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl gradient-text group-data-[collapsible=icon]:hidden">MedMate</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu onOpenChange={(open) => {
                if (!open) {
                  setTimeout(() => setShowMobileLanguages(false), 200);
                }
              }}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${!isMobile && state === "collapsed" ? "justify-center" : ""}`}
                  >
                    <User className="h-4 w-4" />
                    {(isMobile || state === "expanded") && (
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                        <span className="truncate font-semibold">{user.username}</span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  {isMobile && showMobileLanguages ? (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMobileLanguages(false);
                        }}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        {t('back') || 'Back'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="max-h-64 overflow-y-auto">
                        {LANGUAGES.map(lang => (
                          <DropdownMenuItem
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.code as any);
                              setShowMobileLanguages(false);
                              closeOnMobile();
                            }}
                            className="text-sm"
                          >
                            {lang.label}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => {
                        navigate('/profile');
                        closeOnMobile();
                      }}>
                        <User className="mr-2 h-4 w-4" />
                        {t('navbar.profile')}
                      </DropdownMenuItem>

                      {isMobile ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setShowMobileLanguages(true);
                          }}
                        >
                          <Languages className="mr-2 h-4 w-4" />
                          {t('navbar.language')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            {t('navbar.language')}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="max-h-64 overflow-y-auto w-48 sm:w-56 sm:-translate-y-24" sideOffset={8}>
                              {LANGUAGES.map(lang => (
                                <DropdownMenuItem
                                  key={lang.code}
                                  onClick={() => {
                                    setLanguage(lang.code as any);
                                    closeOnMobile();
                                  }}
                                  className="text-xs sm:text-sm"
                                >
                                  {lang.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={async () => {
                        await handleLogout();
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('navbar.logout')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuItem onClick={closeOnMobile}>
                <SidebarMenuButton asChild>
                  <Link to="/auth" onClick={closeOnMobile}>
                    <User className="h-4 w-4" />
                    <span>{t('navbar.login')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
