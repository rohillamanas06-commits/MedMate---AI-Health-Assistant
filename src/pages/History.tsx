import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageSquare, Calendar, Clock, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { parseUTCDate } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

// Inline dynamic range chart (mirrors ReportExplainer)
function RangeChart({
  testName, value, unit, status, refMin, refMax,
}: {
  testName: string; value: number; unit?: string; status: string;
  refMin?: number | null; refMax?: number | null;
}) {
  const hasRange = refMin != null && refMax != null;
  const rangeMin = refMin ?? 0;
  const rangeMax = refMax ?? (value * 2 || 100);
  const displayPad = (rangeMax - rangeMin) * 0.2;
  const displayMin = Math.max(0, rangeMin - displayPad);
  const displayMax = rangeMax + displayPad;
  const totalRange = displayMax - displayMin;
  const valuePercent = Math.min(Math.max(((value - displayMin) / totalRange) * 100, 0), 100);
  const normalMinPct = ((rangeMin - displayMin) / totalRange) * 100;
  const normalMaxPct = ((rangeMax - displayMin) / totalRange) * 100;
  const statusColor = status === 'High' ? '#ef4444' : status === 'Low' ? '#3b82f6' : '#22c55e';
  return (
    <div className="mb-4 p-3 rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">{testName}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          status === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
          status === 'Low'  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
          'bg-yellow-100 text-yellow-700'
        }`}>{value}{unit ? ` ${unit}` : ''} — {status}</span>
      </div>
      <div className="relative h-6 rounded-full overflow-hidden bg-muted/40">
        <div className="absolute top-0 h-full" style={{ left: 0, width: `${normalMinPct}%`, backgroundColor: '#3b82f6', opacity: 0.25 }} />
        <div className="absolute top-0 h-full" style={{ left: `${normalMinPct}%`, width: `${normalMaxPct - normalMinPct}%`, backgroundColor: '#22c55e', opacity: 0.3 }} />
        <div className="absolute top-0 h-full" style={{ left: `${normalMaxPct}%`, width: `${100 - normalMaxPct}%`, backgroundColor: '#ef4444', opacity: 0.25 }} />
        <div className="absolute top-0 h-full w-1 rounded" style={{ left: `${valuePercent}%`, backgroundColor: statusColor, transform: 'translateX(-50%)', zIndex: 10 }} />
      </div>
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        <span className="text-blue-500">Low</span>
        {hasRange && <span className="text-green-600 font-medium">Normal {refMin}–{refMax}{unit ? ` ${unit}` : ''}</span>}
        <span className="text-red-500">High</span>
      </div>
    </div>
  );
}

export default function History() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [diagnosisRes, chatRes, reportRes]: any = await Promise.all([
        api.getDiagnosisHistory(1, 20),
        api.getChatHistory(1, 20),
        api.getReportHistory(1, 20)
      ]);
      setDiagnoses(diagnosisRes.diagnoses || []);
      setChats(chatRes.chats || []);
      setReports(reportRes.reports || []);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiagnosis = async (id: number) => {
    try {
      await api.deleteDiagnosisHistoryItem(id);
      setDiagnoses(prev => prev.filter(d => d.id !== id));
      toast.success('Diagnosis removed');
    } catch {
      toast.error('Failed to remove diagnosis');
    }
  };

  const handleClearAllDiagnoses = async () => {
    if (!confirm('Are you sure you want to clear all diagnoses?')) return;
    try {
      await api.deleteAllDiagnosisHistory();
      setDiagnoses([]);
      toast.success('All diagnoses cleared');
    } catch {
      toast.error('Failed to clear diagnoses');
    }
  };

  const handleDeleteChat = async (id: number) => {
    try {
      await api.deleteChatHistoryItem(id);
      setChats(prev => prev.filter(c => c.id !== id));
      toast.success('Chat removed');
    } catch {
      toast.error('Failed to remove chat');
    }
  };

  const handleClearAllChats = async () => {
    if (!confirm('Are you sure you want to clear all chat conversations?')) return;
    try {
      await api.deleteAllChatHistory();
      setChats([]);
      toast.success('All chats cleared');
    } catch {
      toast.error('Failed to clear chats');
    }
  };

  const handleDeleteReport = async (id: number) => {
    try {
      await api.deleteReportHistoryItem(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast.success('Report removed');
    } catch {
      toast.error('Failed to remove report');
    }
  };

  const handleClearAllReports = async () => {
    if (!confirm('Are you sure you want to clear all report history?')) return;
    try {
      await api.deleteAllReportHistory();
      setReports([]);
      toast.success('All reports cleared');
    } catch {
      toast.error('Failed to clear reports');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 gradient-text">{t('history.title', 'Medical History')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('history.subtitle', 'View your past diagnoses, conversations, and reports')}
          </p>
        </div>

        <Card className="glass animate-fade-in">
          <Tabs defaultValue="diagnoses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diagnoses">
                <Brain className="h-4 w-4 mr-2" />
                <span className="truncate">{t('history.diagnoses_tab', 'Diagnoses')} ({diagnoses.length})</span>
              </TabsTrigger>
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="truncate">{t('history.chats_tab', 'Chat History')} ({chats.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                <span className="truncate">{t('history.reports_tab', 'Report History')} ({reports.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diagnoses" className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold hidden md:block">{t('history.diagnosis_history', 'Diagnosis History')}</h2>
                {diagnoses.length > 0 && !loading && (
                  <Button 
                    variant="destructive" 
                    size="default" 
                    onClick={handleClearAllDiagnoses} 
                    className="ml-auto shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('history.remove_all', 'Remove All')}
                  </Button>
                )}
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : diagnoses.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">{t('history.no_diagnoses', 'No Diagnoses Yet')}</h3>
                  <p className="text-muted-foreground">
                    {t('history.no_diagnoses_desc', 'Your diagnosis history will appear here')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diagnoses.map((diagnosis, index) => (
                    <Card
                      key={diagnosis.id}
                      className="p-6 hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 truncate pr-2">
                            {diagnosis.symptoms}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {parseUTCDate(diagnosis.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {parseUTCDate(diagnosis.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink min-w-0">
                          {/* View Results toggle — show if there is any result data */}
                          {(diagnosis.result?.diseases?.length > 0 || diagnosis.result?.conditions?.length > 0 || diagnosis.result?.observation || diagnosis.result?.analysis || diagnosis.image_url) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 hidden xs:flex whitespace-nowrap"
                              onClick={() => setExpandedDiagnosis(expandedDiagnosis === diagnosis.id ? null : diagnosis.id)}
                            >
                              {expandedDiagnosis === diagnosis.id ? (
                                <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Hide Results</>
                              ) : (
                                <><ChevronDown className="h-3.5 w-3.5 mr-1" /> View Results</>
                              )}
                            </Button>
                          )}
                          {/* Mobile icon button for View Results */}
                          {(diagnosis.result?.diseases?.length > 0 || diagnosis.result?.conditions?.length > 0 || diagnosis.result?.observation || diagnosis.result?.analysis || diagnosis.image_url) && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 xs:hidden"
                              onClick={() => setExpandedDiagnosis(expandedDiagnosis === diagnosis.id ? null : diagnosis.id)}
                            >
                              {expandedDiagnosis === diagnosis.id ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 text-destructive border-destructive/20 hover:bg-destructive hover:text-white hover:border-destructive transition-colors bg-transparent flex-shrink-0"
                            onClick={() => handleDeleteDiagnosis(diagnosis.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Always-visible preview: top 2 conditions/diseases */}
                      {expandedDiagnosis !== diagnosis.id && (
                        <div className="space-y-2 mt-3">
                          {/* Image analysis: conditions[] */}
                          {diagnosis.result?.conditions?.slice(0, 2).map((c: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{c.name}</span>
                                <span className="font-bold text-primary">{c.confidence}%</span>
                              </div>
                              <Progress value={c.confidence} />
                            </div>
                          ))}
                          {/* Text diagnosis: diseases[] */}
                          {!diagnosis.result?.conditions && diagnosis.result?.diseases?.slice(0, 2).map((d: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">{d.name}</span>
                                <span className="font-bold text-primary">{d.confidence}%</span>
                              </div>
                              <Progress value={d.confidence} />
                            </div>
                          ))}
                          {/* observation preview */}
                          {diagnosis.result?.observation && (
                            <p className="text-xs text-muted-foreground italic truncate">{diagnosis.result.observation}</p>
                          )}
                        </div>
                      )}

                      {/* Expanded Results Panel */}
                      {expandedDiagnosis === diagnosis.id && (
                        <div className="mt-4 space-y-4 border-t border-border/50 pt-4 animate-fade-in">

                          {/* Image */}
                          {diagnosis.image_url && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">🖼️ Analyzed Image</h4>
                              <img
                                src={diagnosis.image_url}
                                alt="Medical scan"
                                className="rounded-xl max-h-64 object-cover border border-border/50 shadow-sm"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) parent.innerHTML = '<div class="flex items-center justify-center h-32 bg-muted/50 rounded-lg"><span class="text-muted-foreground text-sm">Image not available</span></div>';
                                }}
                              />
                            </div>
                          )}

                          {/* IMAGE ANALYSIS: observation */}
                          {diagnosis.result?.observation && (
                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2 text-sm">🔍 Image Observation</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {diagnosis.result.observation}
                              </p>
                            </div>
                          )}

                          {/* IMAGE ANALYSIS: conditions[] */}
                          {diagnosis.result?.conditions?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">🧠 Detected Conditions</h4>
                              <div className="space-y-3">
                                {diagnosis.result.conditions.map((c: any, i: number) => (
                                  <div key={i} className="space-y-1.5 p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">{c.name}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        c.confidence >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                        c.confidence >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>{c.confidence}%</span>
                                    </div>
                                    <Progress value={c.confidence} className="h-2" />
                                    {c.note && (
                                      <p className="text-xs text-muted-foreground leading-relaxed">{c.note}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TEXT DIAGNOSIS: diseases[] */}
                          {diagnosis.result?.diseases?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">🧠 AI Analysis — Possible Conditions</h4>
                              <div className="space-y-3">
                                {diagnosis.result.diseases.map((disease: any, i: number) => (
                                  <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{disease.name}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        disease.confidence >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                        disease.confidence >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>{disease.confidence}%</span>
                                    </div>
                                    <Progress value={disease.confidence} className="h-2" />
                                    {(disease.description || disease.explanation) && (
                                      <p className="text-xs text-muted-foreground leading-relaxed">{disease.description || disease.explanation}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI analysis text */}
                          {diagnosis.result?.analysis && (
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                              <h4 className="font-semibold text-primary mb-2 text-sm">📋 AI Analysis</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {diagnosis.result.analysis}
                              </p>
                            </div>
                          )}

                          {/* Recommendation */}
                          {diagnosis.result?.recommendation && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm mb-1">⚠️ Recommendation</h4>
                              <p className="text-sm text-yellow-600 dark:text-yellow-300">{diagnosis.result.recommendation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chats" className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold hidden md:block">{t('history.chats_tab', 'Chat History')}</h2>
                {chats.length > 0 && !loading && (
                  <Button 
                    variant="destructive" 
                    size="default" 
                    onClick={handleClearAllChats} 
                    className="ml-auto shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('history.remove_all', 'Remove All')}
                  </Button>
                )}
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">{t('history.no_chats', 'No Chat History')}</h3>
                  <p className="text-muted-foreground">
                    {t('history.no_chats_desc', 'Your conversations will appear here')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chats.map((chat, index) => (
                    <Card
                      key={chat.id}
                      className="p-6 hover-lift animate-fade-in relative group"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="absolute top-2 right-2 text-destructive border-destructive/20 hover:bg-destructive hover:text-white hover:border-destructive transition-colors bg-white/5 backdrop-blur-sm h-7 w-7" 
                        onClick={() => handleDeleteChat(chat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary">{t('history.you', 'You')}</span>
                            <span className="text-xs text-muted-foreground">
                              {parseUTCDate(chat.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                            {chat.message}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-secondary">{t('history.ai_assistant', 'AI Assistant')}</span>
                          </div>
                          <p className="text-sm bg-primary/5 rounded-lg p-3 whitespace-pre-wrap">
                            {chat.response.length > 200 ? chat.response.substring(0, 200) + '...' : chat.response}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reports" className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold hidden md:block">{t('history.reports_tab', 'Report History')}</h2>
                {reports.length > 0 && !loading && (
                  <Button 
                    variant="destructive" 
                    size="default" 
                    onClick={handleClearAllReports} 
                    className="ml-auto shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('history.remove_all', 'Remove All')}
                  </Button>
                )}
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </Card>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">{t('history.no_reports', 'No Reports Yet')}</h3>
                  <p className="text-muted-foreground">
                    {t('history.no_reports_desc', 'Your analyzed medical reports will appear here')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reports.map((report, index) => (
                    <Card
                      key={report.id}
                      className="p-6 hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 truncate pr-2">
                            {report.file_name || 'Medical Document'}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {parseUTCDate(report.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {parseUTCDate(report.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink min-w-0">
                          {/* View Results toggle */}
                          {(report.result?.interpreted?.length > 0 || report.result?.summary || report.result?.explanation) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 hidden xs:flex whitespace-nowrap"
                              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                            >
                              {expandedReport === report.id ? (
                                <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Hide Results</>
                              ) : (
                                <><ChevronDown className="h-3.5 w-3.5 mr-1" /> View Results</>
                              )}
                            </Button>
                          )}
                          {/* Mobile icon button for View Results */}
                          {(report.result?.interpreted?.length > 0 || report.result?.summary || report.result?.explanation) && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 xs:hidden"
                              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                            >
                              {expandedReport === report.id ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline" 
                            size="icon"
                            className="h-7 w-7 text-destructive border-destructive/20 hover:bg-destructive hover:text-white hover:border-destructive transition-colors bg-transparent flex-shrink-0"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Results Panel */}
                      {expandedReport === report.id && (
                        <div className="mt-4 space-y-4 border-t border-border/50 pt-4 animate-fade-in">

                          {/* AI Summary */}
                          {(report.result?.summary || report.result?.explanation?.english || report.result?.explanation?.summary) && (
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                              <h4 className="font-semibold text-primary mb-2 text-sm">📝 Summary</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {report.result?.explanation?.english ||
                                 report.result?.explanation?.summary ||
                                 report.result?.summary}
                              </p>
                            </div>
                          )}

                          {/* Interpreted table */}
                          {report.result?.interpreted?.length > 0 && (
                            <div className="overflow-hidden">
                              <h4 className="font-semibold text-sm mb-2">🧪 Lab Results</h4>
                              <div className="rounded-md border border-border/50 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50 border-b border-border/50 sticky top-0">
                                    <tr>
                                      <th className="p-2 text-left font-medium text-xs sm:text-sm">Test</th>
                                      <th className="p-2 text-left font-medium text-xs sm:text-sm">Value</th>
                                      <th className="p-2 text-left font-medium text-xs sm:text-sm">Status</th>
                                      <th className="p-2 text-left font-medium text-xs sm:text-sm hidden sm:table-cell">Note</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {report.result.interpreted.map((item: any, i: number) => (
                                      <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                                        <td className="p-2 font-medium text-primary text-xs sm:text-sm whitespace-nowrap">{item.test_name}</td>
                                        <td className="p-2 text-xs sm:text-sm whitespace-nowrap">{item.value} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                                        <td className="p-2">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            item.status === 'Normal' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                            item.status === 'Unknown' || item.status === 'Review' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                            'bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                                          }`}>{item.status}</span>
                                        </td>
                                        <td className="p-2 text-muted-foreground text-xs hidden sm:table-cell">{item.condition}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Abnormal value charts */}
                          {report.result?.interpreted?.filter(
                            (r: any) => r.status !== 'Normal' && r.status !== 'Unknown' && r.status !== 'Review'
                          ).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-3">📊 Abnormal Values — Visual Range</h4>
                              {report.result.interpreted
                                .filter((r: any) => r.status !== 'Normal' && r.status !== 'Unknown' && r.status !== 'Review')
                                .map((r: any) => (
                                  <RangeChart
                                    key={r.test_name}
                                    testName={r.test_name}
                                    value={r.value}
                                    unit={r.unit}
                                    status={r.status}
                                    refMin={r.ref_min}
                                    refMax={r.ref_max}
                                  />
                                ))}
                            </div>
                          )}

                          {/* Key findings */}
                          {(report.result?.key_findings || report.result?.explanation?.key_findings)?.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">🔍 Key Findings</h4>
                              <ul className="space-y-1">
                                {(report.result?.key_findings || report.result?.explanation?.key_findings).map((f: string, i: number) => (
                                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                    <span className="text-primary mt-0.5">•</span>{f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
