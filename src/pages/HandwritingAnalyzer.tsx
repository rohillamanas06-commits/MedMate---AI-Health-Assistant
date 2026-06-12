import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/action-button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  FileImage,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

export default function HandwritingAnalyzer() {
  const { user, updateCredits, checkAuth } = useAuth();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const hasCredits = (user?.credits ?? 0) > 0;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleCreditsSuccess = async () => {
    await checkAuth();
    toast.success('Credits added! You can continue with handwriting analysis.');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP, BMP, GIF)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleAnalyzeHandwriting = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return false;
    }

    setResult(null);

    try {
      const response: any = await api.analyzeHandwriting(selectedImage, currentLanguage);
      setResult(response.result);

      // Update credits if returned
      if (response.remaining_credits !== undefined) {
        updateCredits(response.remaining_credits);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

      // Check if it's insufficient credits error
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else if (errorMessage.includes('timeout')) {
        toast.error(t('features.prescription_timeout') || 'Analysis is taking longer than expected. Please try again with a different image.');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Analysis failed: ${errorMessage}`);
      }
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8">
      <div className="w-full px-4 md:px-6 lg:px-8 mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 theme-title">
            {t('navbar.prescription_decoder') || 'Prescription Decoder'}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-lg">
            {t('features.prescription_description') || 'Upload an image of handwritten prescriptions and medical notes.'}
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          {/* Input Section */}
          <div className="w-full flex flex-col gap-3 lg:gap-4">
            <Card className="p-4 glass w-full">
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <Label className="text-xs lg:text-sm">{t('common.select_image') || 'Select Image'}</Label>
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors flex items-center justify-center min-h-[260px] lg:min-h-[360px] overflow-hidden relative ${selectedImage && imagePreview ? 'border-primary p-0' : 'border-border p-4 lg:p-6'}`}
                    onClick={() => document.getElementById('handwriting-upload')?.click()}
                  >
                    {selectedImage && imagePreview ? (
                      <div className="absolute inset-0 w-full h-full group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                          <p className="text-white text-sm lg:text-base font-medium">{t('explainer.change_click', 'Click to change image')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 lg:h-8 lg:w-8 mx-auto text-muted-foreground" />
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          {t('common.select_image') || 'Select Image'}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('common.jpg_png_webp') || 'JPG, PNG, WebP, BMP, GIF'}</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="handwriting-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <ActionButton 
                  action={hasCredits ? handleAnalyzeHandwriting : undefined}
                  onClick={!hasCredits ? () => setShowBuyCredits(true) : undefined} 
                  disabled={!selectedImage && hasCredits} 
                  successMessage={t('features.prescription_complete') || 'Analysis Complete'}
                  className={`w-full text-xs lg:text-sm h-9 lg:h-10 ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`} 
                  size="sm"
                >
                  {!hasCredits ? (
                    <>
                      <span className="hidden sm:inline">{t('features.prescription_no_credits') || 'No Credits'}</span>
                      <span className="sm:hidden">Credits</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">{t('features.prescription_analyze_btn') || 'Analyze Image'}</span>
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
                  <h2 className="text-lg lg:text-xl font-bold mb-4 border-b border-border/50 pb-4 break-words">{t('common.analysis_results') || 'Analysis Results'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Extracted Text */}
                      {result.extracted_text && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm lg:text-base">{t('features.extracted_text') || 'Extracted Text'}</h3>
                          <div className="bg-muted/50 p-3 lg:p-4 rounded-lg border border-border/50 max-h-[200px] overflow-y-auto">
                            <p className="text-xs lg:text-sm text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                              {result.extracted_text}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Medical Terms */}
                      {result.medical_terms && result.medical_terms.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm lg:text-base">{t('features.medical_terms') || 'Medical Terms'}</h3>
                          <div className="flex flex-wrap gap-2">
                            {result.medical_terms.map((term: string, idx: number) => (
                              <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs lg:text-sm font-medium">{term}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Explanation */}
                      {result.explanation && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm lg:text-base">{t('features.ai_explanation') || 'AI Explanation'}</h3>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 lg:p-4 rounded-lg">
                            <p className="text-xs lg:text-sm text-foreground/80 leading-relaxed">{result.explanation}</p>
                          </div>
                        </div>
                      )}

                      {/* Confidence Score */}
                      {result.confidence_score !== undefined && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm lg:text-base">{t('features.confidence') || 'Confidence'}</h3>
                            <span className="text-xs lg:text-sm text-muted-foreground">{(result.confidence_score * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={result.confidence_score * 100} className="h-2" />
                        </div>
                      )}

                    </div>
                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Recommendations */}
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm lg:text-base">{t('features.recommendations') || 'Recommendations'}</h3>
                          <ul className="space-y-2 text-xs lg:text-sm bg-muted/30 p-3 lg:p-4 rounded-lg border border-border/50">
                            {result.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex gap-2 text-foreground/80"><span className="text-green-600 dark:text-green-400 font-bold">•</span><span>{rec}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyCredits && (
        <BuyCreditsModal
          isOpen={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
          onSuccess={handleCreditsSuccess}
          currentCredits={user?.credits ?? 0}
        />
      )}
    </div>
  );
}