import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Brain,
  MessageSquare,
  MapPin,
  ArrowRight,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';
import { CreditsHistory } from '@/components/CreditsHistory';

export default function Dashboard() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleCreditsSuccess = async () => {
    await checkAuth();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      // Fetch chat, diagnosis, and report history
      const [chatResponse, diagnosisResponse, reportResponse] = await Promise.all([
        api.getChatHistory(1, 5) as Promise<any>,
        api.getDiagnosisHistory(1, 5) as Promise<any>,
        api.getReportHistory(1, 5) as Promise<any>,
      ]);
      
      // Combine and format the data
      const combined: any[] = [];
      
      // Add chats
      if (chatResponse.chats && Array.isArray(chatResponse.chats)) {
        chatResponse.chats.forEach((chat: any) => {
          combined.push({
            id: `chat-${chat.id}`,
            type: 'chat',
            icon: '💬',
            title: chat.message.substring(0, 50) + (chat.message.length > 50 ? '...' : ''),
            description: chat.response.substring(0, 80) + (chat.response.length > 80 ? '...' : ''),
            created_at: chat.created_at,
            link: '/history',
          });
        });
      }

      // Add diagnoses
      if (diagnosisResponse.diagnoses && Array.isArray(diagnosisResponse.diagnoses)) {
        diagnosisResponse.diagnoses.forEach((diagnosis: any) => {
          combined.push({
            id: `diagnosis-${diagnosis.id}`,
            type: 'diagnosis',
            icon: '🔍',
            title: diagnosis.symptoms.substring(0, 50) + (diagnosis.symptoms.length > 50 ? '...' : ''),
            description: 'Symptom Analysis',
            created_at: diagnosis.created_at,
            link: '/history',
          });
        });
      }

      // Add reports
      if (reportResponse.reports && Array.isArray(reportResponse.reports)) {
        reportResponse.reports.forEach((report: any) => {
          combined.push({
            id: `report-${report.id}`,
            type: 'report',
            icon: '📋',
            title: (report.file_name || report.filename || 'Medical Report').substring(0, 50),
            description: 'Report Analysis',
            created_at: report.created_at,
            link: '/history',
          });
        });
      }

      // Sort by date (newest first) and limit to 5
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentHistory(combined.slice(0, 5));
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Add error boundary effect to prevent crashes
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Dashboard error:', event.error);
      setError('An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const quickActions = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: t('dashboard.symptom_checker'),
      description: t('dashboard.symptom_desc'),
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/diagnose'),
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: t('dashboard.ai_chat'),
      description: t('dashboard.chat_desc'),
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/chat'),
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: t('home.feature_report_title'),
      description: t('home.feature_report_desc'),
      color: 'from-indigo-500 to-violet-500',
      action: () => navigate('/explain'),
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: t('dashboard.find_hospitals'),
      description: t('dashboard.hosp_desc'),
      color: 'from-green-500 to-teal-500',
      action: () => navigate('/hospitals'),
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: 'Buy Credits',
      description: 'Purchase more credits for your account',
      color: 'from-yellow-500 to-amber-500',
      action: () => setShowBuyCredits(true),
    },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-7xl">
        {/* Welcome Header with Credits */}
        <div className="mb-8 animate-slide-up relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {t('dashboard.welcome')} <span className="gradient-text">{user?.username}</span>!
              </h1>
              <p className="text-muted-foreground text-lg">
                {t('dashboard.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setShowBuyCredits(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/60 hover:bg-gradient-to-r hover:from-yellow-500/30 hover:to-amber-500/30 transition-all cursor-pointer"
              title="Buy Credits"
            >
              <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-semibold text-yellow-700 dark:text-yellow-300">{user?.credits ?? 0}</span>
            </button>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('dashboard.quick_actions')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="group cursor-pointer rounded-lg border border-border overflow-hidden animate-fade-in transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4 h-full flex flex-col relative bg-card hover:bg-card/80 transition-colors">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`}></div>
                  <div className="relative z-10">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${action.color} text-white mb-3`}>
                      {action.icon}
                    </div>
                    <h3 className="text-base font-semibold mb-1 line-clamp-1">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{action.description}</p>
                    <div className="flex items-center text-primary text-xs font-medium group-hover:gap-1 transition-all">
                      Get Started
                      <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent History</h2>
            <Button variant="outline" onClick={() => navigate('/history')}>
              {t('dashboard.view_all')}
            </Button>
          </div>
          
          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center glass">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
              <h3 className="text-xl font-semibold mb-2">{t('dashboard.unable_load')}</h3>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              <Button onClick={loadDashboardData} variant="outline">
                {t('dashboard.try_again')}
              </Button>
            </Card>
          ) : recentHistory.length === 0 ? (
            <Card className="p-12 text-center glass">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by chatting with the AI, analyzing your symptoms, or uploading a medical report
              </p>
              <Button onClick={() => navigate('/chat')}>
                Start Chatting
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item, index) => (
                <Card
                  key={item.id}
                  className="p-4 hover-lift cursor-pointer animate-fade-in transition-all hover:shadow-md"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(item.link)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.type === 'chat' ? 'Chat' : item.type === 'diagnosis' ? 'Diagnosis' : 'Report'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Credits History */}
        {user && (
          <div className="mt-8">
            <CreditsHistory />
          </div>
        )}
      </div>
      </div>
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        onSuccess={handleCreditsSuccess}
        currentCredits={user?.credits ?? 0}
      />
    </ErrorBoundary>
  );
}
