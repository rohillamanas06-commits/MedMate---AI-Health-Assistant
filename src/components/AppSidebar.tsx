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
  Clock
} from "lucide-react"
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
  const { state, setOpen } = useSidebar()

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
    setOpen(false);
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
        <div className="flex items-center gap-2 p-2">
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
                    <Link to={item.url} onClick={() => setOpen(false)}>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:justify-center"
                  >
                    <User className="h-4 w-4" />
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0 md:hidden">
                      <span className="truncate font-semibold">{user.username}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem onClick={() => {
                    navigate('/profile');
                    setOpen(false);
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    {t('navbar.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Languages className="mr-2 h-4 w-4" />
                      {t('navbar.language')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="max-h-48 overflow-y-auto max-w-xs">
                        {LANGUAGES.map(lang => (
                          <DropdownMenuItem 
                            key={lang.code} 
                            onClick={() => {
                              setLanguage(lang.code as any);
                              setOpen(false);
                            }}
                            className="text-xs sm:text-sm"
                          >
                            {lang.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    await handleLogout();
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navbar.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
             <SidebarMenuItem onClick={() => setOpen(false)}>
                <SidebarMenuButton asChild>
                    <Link to="/auth" onClick={() => setOpen(false)}>
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
