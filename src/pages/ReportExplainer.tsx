import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/action-button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

function RangeChart({
  testName,
  value,
  unit,
  status,
  refMin,
  refMax,
}: {
  testName: string;
  value: number;
  unit?: string;
  status: string;
  refMin?: number | null;
  refMax?: number | null;
}) {
  // Build a dynamic range from ref_min/ref_max returned by backend
  const hasRange = refMin != null && refMax != null;

  // Fallback: simple "Low / Normal / High" zones if no backend range
  let rangeMin = refMin ?? 0;
  let rangeMax = refMax ?? (value * 2 || 100);

  // Expand display range 20% beyond min/max so marker isn't at edge
  const displayPad = (rangeMax - rangeMin) * 0.2;
  const displayMin = Math.max(0, rangeMin - displayPad);
  const displayMax = rangeMax + displayPad;
  const totalRange = displayMax - displayMin;

  const valuePercent = Math.min(
    Math.max(((value - displayMin) / totalRange) * 100, 0),
    100
  );
  const normalMinPct = ((rangeMin - displayMin) / totalRange) * 100;
  const normalMaxPct = ((rangeMax - displayMin) / totalRange) * 100;

  const statusColor =
    status === 'High'
      ? '#ef4444'
      : status === 'Low'
        ? '#3b82f6'
        : '#22c55e';

  return (
    <div className="mb-5 p-4 rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm text-foreground">{testName}</span>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${status === 'High'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            : status === 'Low'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
            }`}
        >
          {value}{unit ? ` ${unit}` : ''} — {status}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-7 rounded-full overflow-hidden bg-muted/40" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)' }}>
        {/* Low zone (before normal) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: 0,
            width: `${normalMinPct}%`,
            backgroundColor: '#3b82f6',
            opacity: 0.25,
          }}
        />
        {/* Normal zone */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${normalMinPct}%`,
            width: `${normalMaxPct - normalMinPct}%`,
            backgroundColor: '#22c55e',
            opacity: 0.3,
          }}
        />
        {/* High zone (after normal) */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${normalMaxPct}%`,
            width: `${100 - normalMaxPct}%`,
            backgroundColor: '#ef4444',
            opacity: 0.25,
          }}
        />

        {/* Value marker line */}
        <div
          className="absolute top-0 h-full w-1 rounded"
          style={{
            left: `${valuePercent}%`,
            backgroundColor: statusColor,
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground px-0.5">
        <span className="text-blue-500">Low</span>
        {hasRange && (
          <span className="text-green-600 font-medium">
            Normal {refMin} – {refMax}{unit ? ` ${unit}` : ''}
          </span>
        )}
        <span className="text-red-500">High</span>
      </div>

      {/* Your value callout */}
      <p className="text-xs text-muted-foreground mt-2">
        Your value:{' '}
        <strong style={{ color: statusColor }}>
          {value}{unit ? ` ${unit}` : ''}
        </strong>
        {hasRange && (
          <> · Normal range: {refMin} – {refMax}{unit ? ` ${unit}` : ''}</>
        )}
      </p>
    </div>
  );
}

export default function ReportExplainer() {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, updateCredits, checkAuth } = useAuth();
  const hasCredits = (user?.credits ?? 0) > 0;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleCreditsSuccess = async () => {
    await checkAuth();
    toast.success('Credits added! You can continue.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      toast.success(t('explainer.file_selected'));
    }
  };

  const handleAnalysis = async () => {
    if (!selectedFile) {
      toast.error(t('explainer.please_upload'));
      return false;
    }

    setResult(null);

    try {
      const data = await api.explainReport(selectedFile, currentLanguage);
      setResult(data.result || data);

      // Update credits if returned
      if (data.remaining_credits !== undefined) {
        updateCredits(data.remaining_credits);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(`${t('explainer.error')}: ${errorMessage}`);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8">
      <div className="w-full px-4 md:px-6 lg:px-8 mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 theme-title">
            {t('explainer.title')}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-lg">
            {t('explainer.subtitle')}
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          {/* Input Section */}
          <div className="w-full flex flex-col gap-3 lg:gap-4">
            <Card className="p-4 glass w-full">
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <Label className="text-xs lg:text-sm">{t('explainer.upload_label')}</Label>
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors flex items-center justify-center min-h-[260px] lg:min-h-[360px] overflow-hidden relative ${selectedFile && selectedFile.type.startsWith('image/') ? 'border-primary p-0' : 'border-border p-4 lg:p-6'}`}
                    onClick={() => document.getElementById('report-upload')?.click()}
                  >
                    {selectedFile ? (
                      selectedFile.type.startsWith('image/') ? (
                        <div className="absolute inset-0 w-full h-full group">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                            <p className="text-white text-sm lg:text-base font-medium">{t('explainer.change_click', 'Click to change image')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileText className="h-6 w-6 lg:h-8 lg:w-8 mx-auto text-primary" />
                          <p className="text-xs lg:text-sm font-medium truncate px-4">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('explainer.change_click')}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 lg:h-8 lg:w-8 mx-auto text-muted-foreground" />
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          {t('explainer.upload_click')}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('explainer.upload_desc')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="report-upload"
                    type="file"
                    accept="image/*,.txt,.pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <ActionButton 
                  action={hasCredits ? handleAnalysis : undefined}
                  onClick={!hasCredits ? () => setShowBuyCredits(true) : undefined} 
                  disabled={!selectedFile && hasCredits} 
                  successMessage={t('explainer.analysis_complete') || 'Analysis Complete'}
                  className={`w-full text-xs lg:text-sm h-9 lg:h-10 ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`} 
                  size="sm"
                >
                  {!hasCredits ? (
                    <>
                      <span className="hidden sm:inline">No Credits</span>
                      <span className="sm:hidden">Credits</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">{t('explainer.analyze_btn')}</span>
                      <span className="sm:hidden">Analyze</span>
                    </>
                  )}
                </ActionButton>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          {result && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3 lg:space-y-4 w-full">
                <Card className="p-4 lg:p-4 glass overflow-hidden w-full">
                  <h2 className="text-lg lg:text-xl font-bold mb-3 lg:mb-4 break-words">{t('explainer.summary_title')}</h2>

                  {/* Handle new text/PDF explanation format (english/hindi) */}
                  {result.explanation && (result.explanation.english || result.explanation.hindi) && !result.explanation.summary && (
                    <Card className="p-3 lg:p-4 mb-3 lg:mb-4 bg-primary/10 border-primary/20 overflow-hidden">
                      <p className="text-xs lg:text-sm leading-relaxed break-words">{currentLanguage === 'hi' ? result.explanation.hindi : result.explanation.english}</p>
                    </Card>
                  )}

                  {/* Handle legacy or image fallback explanation format */}
                  {(result.explanation?.summary || result.summary) && (
                    <Card className="p-3 lg:p-4 mb-3 lg:mb-4 bg-primary/10 border-primary/20 overflow-hidden">
                      <p className="text-xs lg:text-sm leading-relaxed break-words">{result.explanation?.summary || result.summary}</p>
                    </Card>
                  )}

                  {/* Interpret Results Table handling */}
                  {result.interpreted && result.interpreted.length > 0 && (
                    <div className="mb-4 sm:mb-6 overflow-hidden">
                      <h3 className="font-semibold text-lg mb-2 sm:mb-3 break-words">Extracted Lab Results Table</h3>
                      <div className="rounded-md border border-border/50 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 border-b border-border/50 sticky top-0">
                            <tr>
                              <th className="p-2 sm:p-3 font-medium text-sm">Test</th>
                              <th className="p-2 sm:p-3 font-medium text-sm">Value</th>
                              <th className="p-2 sm:p-3 font-medium text-sm">Status</th>
                              <th className="p-2 sm:p-3 font-medium text-sm hidden sm:table-cell">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.interpreted.map((item: any, i: number) => (
                              <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                                <td className="p-2 sm:p-3 font-medium text-primary text-sm whitespace-nowrap">{item.test_name}</td>
                                <td className="p-2 sm:p-3 text-sm whitespace-nowrap">{item.value} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                                <td className="p-2 sm:p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'Normal' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/40 dark:text-green-400' : item.status === 'Unknown' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-2 sm:p-3 text-muted-foreground text-xs hidden sm:table-cell">{item.condition}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Abnormal value charts — dynamic, works for ALL extracted tests */}
                  {result.interpreted &&
                    result.interpreted.filter(
                      (r: any) => r.status !== 'Normal' && r.status !== 'Unknown' && r.status !== 'Review'
                    ).length > 0 && (
                      <div className="mt-4 sm:mt-6 mb-4 sm:mb-6 overflow-hidden">
                        <h3 className="text-lg font-semibold mb-1 sm:mb-1 flex items-center gap-2 break-words">
                          <span>📊</span> Abnormal Values
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                          The bar shows where your value falls relative to the normal range.
                        </p>
                        {result.interpreted
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

                  {/* Key Findings List handling */}
                  {((result.explanation?.key_findings) || result.key_findings) && ((result.explanation?.key_findings) || result.key_findings).length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h3 className="font-semibold text-lg mb-2 sm:mb-3 break-words">{t('explainer.key_findings')}</h3>
                      <ul className="space-y-1 sm:space-y-2">
                        {((result.explanation?.key_findings) || result.key_findings).map((finding: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                            <span className="break-words">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Terms Explained handling */}
                  {((result.explanation?.terms) || result.terms) && ((result.explanation?.terms) || result.terms).length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <h3 className="font-semibold text-lg mb-2 sm:mb-3 break-words">{t('explainer.terms_explained')}</h3>
                      <div className="grid gap-2 sm:gap-3">
                        {((result.explanation?.terms) || result.terms).map((termItem: any, i: number) => (
                          <div key={i} className="p-2 sm:p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <h4 className="font-semibold text-primary text-sm break-words">{termItem.term}</h4>
                            <p className="text-sm text-muted-foreground mt-1 break-words">{termItem.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps handling */}
                  {(result.explanation?.next_steps || result.next_steps) && (
                    <Alert className="mb-4 bg-primary/5 border-primary/20 text-sm">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <strong className="text-primary">{t('explainer.next_steps')}</strong> <span className="break-words">{result.explanation?.next_steps || result.next_steps}</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {(result.explanation?.disclaimer || result.disclaimer) && (
                    <p className="text-xs text-muted-foreground mt-3 lg:mt-4 text-center pb-1 lg:pb-2 break-words">{result.explanation?.disclaimer || result.disclaimer}</p>
                  )}
                </Card>
              </div>
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
    </div>
  );
}
