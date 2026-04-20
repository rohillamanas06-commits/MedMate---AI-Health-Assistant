import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

export default function HandwritingAnalyzer() {
  const { user, updateCredits, checkAuth } = useAuth();
  const { t } = useTranslation();
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
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response: any = await api.analyzeHandwriting(selectedImage);
      setResult(response.result);
      toast.success(t('features.prescription_complete') || 'Prescription analysis complete!');

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-6 sm:py-8 px-4 sm:px-0">
      <div className="container max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 px-4 text-center">
          <h1 className="text-4xl font-bold mb-3 gradient-text leading-tight">
            {t('navbar.prescription_decoder') || 'Prescription Decoder'}
          </h1>
          <p className="text-muted-foreground text-lg px-2">
            {t('features.prescription_description') || 'Upload an image of handwritten prescriptions and medical notes. Our AI will analyze, extract, and explain the content using advanced OCR and NLP.'}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Input Section */}
          <div className="space-y-4 sm:space-y-6 w-full min-w-0">
            <Card className="p-4 sm:p-6 glass w-full">
              <div className="space-y-3 sm:space-y-4">
                {/* File Upload */}
                <div>
                  <Label className="text-base">{t('common.select_image') || 'Select Image'}</Label>
                  <div
                    className={`mt-2 border-2 border-dashed border-border rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-primary transition-colors ${selectedImage && imagePreview ? 'border-primary' : 'border-border'}`}
                    onClick={() => document.getElementById('handwriting-upload')?.click()}
                  >
                    {selectedImage && imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 sm:h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 shadow-md hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-muted-foreground" />
                        <p className="text-base text-muted-foreground">
                          {t('common.select_image') || 'Select Image'}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('common.jpg_png_webp') || 'JPG, PNG, WebP, BMP, GIF'}</p>
                        <p className="text-xs text-muted-foreground">{t('common.max_10mb') || 'Max 10MB'}</p>
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

                {/* Action Button */}
                <Button
                  onClick={!hasCredits ? () => setShowBuyCredits(true) : handleAnalyzeHandwriting}
                  disabled={loading || (!selectedImage && hasCredits)}
                  className={`w-full ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('features.prescription_analyzing') || 'Analyzing...'}
                    </>
                  ) : !hasCredits ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {t('features.prescription_no_credits') || 'No Credits Available'}
                    </>
                  ) : (
                    <>
                      <FileImage className="h-4 w-4 mr-2" />
                      {t('features.prescription_analyze_btn') || 'Analyze Image'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4 sm:space-y-6 w-full min-w-0">
            {/* Scrollable Results Area */}
            <div className="overflow-y-auto max-h-[70vh] pr-2 scrollable-content space-y-4 sm:space-y-6">
              {/* Detailed Results - Replaces image preview when available */}
              {result && (
                <Card className="p-4 sm:p-6 glass">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <h2 className="text-xl font-bold">{t('common.analysis_results') || 'Analysis Results'}</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Extracted Text */}
                    {result.extracted_text && (
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileImage className="h-4 w-4" />
                          {t('features.extracted_text') || 'Extracted Text'}
                        </h3>
                        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border border-border/50 max-h-[200px] overflow-y-auto">
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                            {result.extracted_text}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Medical Terms */}
                    {result.medical_terms && result.medical_terms.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {t('features.medical_terms') || 'Medical Terms Detected'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.medical_terms.map((term: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Explanation */}
                    {result.explanation && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {t('features.ai_explanation') || 'AI Explanation'}
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 sm:p-4 rounded-lg">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confidence Score */}
                    {result.confidence_score !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">
                            {t('features.confidence') || 'Analysis Confidence'}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {(result.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={result.confidence_score * 100} className="h-2" />
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {t('features.recommendations') || 'Recommendations'}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {result.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex gap-2 text-foreground/80">
                              <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {!result && (
                <Card className="p-6 sm:p-12 text-center glass w-full">
                  <FileImage className="h-16 sm:h-24 w-16 sm:w-24 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{t('explainer.ready_title')}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {t('features.prescription_ready_desc')}
                  </p>
                </Card>
              )}
            </div>


          </div>
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
