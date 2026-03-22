import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

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
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            status === 'High'
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
  const { updateCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await api.explainReport(selectedFile, currentLanguage);
      setResult(data.result || data);
      toast.success(t('explainer.analysis_complete'));

      // Update credits if returned
      if (data.remaining_credits !== undefined) {
        updateCredits(data.remaining_credits);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(`${t('explainer.error')}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 px-4 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent leading-tight">
            {t('explainer.title')}
          </h1>
          <p className="text-muted-foreground text-lg px-2">
            {t('explainer.subtitle')}
          </p>
          <div className="mt-3 inline-block px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-primary font-medium">💳 Each report analysis uses 1 credit</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6 glass animate-fade-in">
              <div className="space-y-4">
                <div>
                  <Label>{t('explainer.upload_label')}</Label>
                  <div
                    className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById('report-upload')?.click()}
                  >
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 mx-auto text-primary" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('explainer.change_click')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
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
                
                <Button onClick={handleAnalysis} disabled={loading || !selectedFile} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('explainer.analyzing')}
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      {t('explainer.analyze_btn')}
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('explainer.disclaimer_title')}</strong>{' '}
                {t('explainer.disclaimer_text')}
              </AlertDescription>
            </Alert>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <div className="space-y-4 animate-scale-in">
                <Card className="p-6 glass">
                  <h2 className="text-2xl font-bold mb-4">{t('explainer.summary_title')}</h2>
                  
                  {/* Handle new text/PDF explanation format (english/hindi) */}
                  {result.explanation && (result.explanation.english || result.explanation.hindi) && !result.explanation.summary && (
                    <Card className="p-4 mb-6 bg-primary/10 border-primary/20">
                      <p className="text-sm leading-relaxed">{currentLanguage === 'hi' ? result.explanation.hindi : result.explanation.english}</p>
                    </Card>
                  )}

                  {/* Handle legacy or image fallback explanation format */}
                  {(result.explanation?.summary || result.summary) && (
                    <Card className="p-4 mb-6 bg-primary/10 border-primary/20">
                      <p className="text-sm leading-relaxed">{result.explanation?.summary || result.summary}</p>
                    </Card>
                  )}

                  {/* Interpret Results Table handling */}
                  {result.interpreted && result.interpreted.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">Extracted Lab Results Table</h3>
                      <div className="rounded-md border border-border/50 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                              <th className="p-3 font-medium">Test Name</th>
                              <th className="p-3 font-medium">Value</th>
                              <th className="p-3 font-medium">Status</th>
                              <th className="p-3 font-medium">Condition Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.interpreted.map((item: any, i: number) => (
                              <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-medium text-primary">{item.test_name}</td>
                                <td className="p-3">{item.value} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'Normal' ? 'bg-green-100/80 text-green-800 dark:bg-green-900/40 dark:text-green-400' : item.status === 'Unknown' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-red-100/80 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">{item.condition}</td>
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
                    <div className="mt-6 mb-6">
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <span>📊</span> Abnormal Values — Visual Range
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
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
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">{t('explainer.key_findings')}</h3>
                      <ul className="space-y-2">
                        {((result.explanation?.key_findings) || result.key_findings).map((finding: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Terms Explained handling */}
                  {((result.explanation?.terms) || result.terms) && ((result.explanation?.terms) || result.terms).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">{t('explainer.terms_explained')}</h3>
                      <div className="grid gap-3">
                        {((result.explanation?.terms) || result.terms).map((termItem: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <h4 className="font-semibold text-primary">{termItem.term}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{termItem.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps handling */}
                  {(result.explanation?.next_steps || result.next_steps) && (
                    <Alert className="mb-4 bg-primary/5 border-primary/20">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <strong className="text-primary">{t('explainer.next_steps')}</strong> {result.explanation?.next_steps || result.next_steps}
                      </AlertDescription>
                    </Alert>
                  )}

                  {(result.explanation?.disclaimer || result.disclaimer) && (
                    <p className="text-xs text-muted-foreground mt-4 text-center pb-2">{result.explanation?.disclaimer || result.disclaimer}</p>
                  )}
                </Card>
              </div>
            ) : (
             <Card className="p-12 text-center glass">
               <FileText className="h-24 w-24 mx-auto mb-4 text-muted-foreground opacity-30 animate-float" />
               <h3 className="text-xl font-semibold mb-2">{t('explainer.ready_title')}</h3>
               <p className="text-muted-foreground">
                 {t('explainer.ready_desc')}
               </p>
             </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
