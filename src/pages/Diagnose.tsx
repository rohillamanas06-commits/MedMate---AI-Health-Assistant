import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mic,
  X,
  Volume2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { BuyCreditsModal } from '@/components/BuyCreditsModal';

export default function Diagnose() {
  const { user, updateCredits, checkAuth } = useAuth();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const hasCredits = (user?.credits ?? 0) > 0;
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const handleTextDiagnosis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response: any = await api.diagnose(symptoms, currentLanguage);
      setResult(response.result);
      toast.success('Analysis complete!');

      // Update credits if returned
      if (response.remaining_credits !== undefined) {
        updateCredits(response.remaining_credits);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Diagnosis failed';

      // Check if it's insufficient credits error
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else if (errorMessage.includes('timeout')) {
        toast.error('Analysis is taking longer than expected. Please try again with shorter symptoms or check your connection.');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Diagnosis failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageDiagnosis = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // For now, analyze the first image (backend needs update for multiple)
      const response: any = await api.diagnoseImage(selectedImages[0], symptoms, currentLanguage);
      setResult(response.result);
      toast.success(`Image analysis complete! (${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} uploaded)`);

      // Update credits if returned
      if (response.remaining_credits !== undefined) {
        updateCredits(response.remaining_credits);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Image analysis failed';

      // Check if it's insufficient credits error
      if (errorMessage.includes('Insufficient credits') || errorMessage.includes('insufficient_credits')) {
        toast.error('Insufficient credits! Please purchase more credits to continue.');
        setShowBuyCredits(true);
      } else if (errorMessage.includes('timeout')) {
        toast.error('Image analysis is taking longer than expected. Please try again with a smaller image or check your connection.');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Image analysis failed: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreditsSuccess = async () => {
    await checkAuth();
    toast.success('Credits added! You can continue with diagnosis.');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      setSelectedImages([file]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews([reader.result as string]);
        toast.success(`Image selected`);
      };
      reader.readAsDataURL(file);

      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak now');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSymptoms(prev => prev + ' ' + transcript);
        toast.success('Voice input captured');
      };

      recognition.onerror = () => {
        toast.error('Voice recognition failed');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast.error('Voice recognition not supported');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
      toast.success('Playing audio');
    } else {
      toast.error('Text-to-speech not supported in your browser');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-orange-500';
      default:
        return 'text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8">
      <div className="w-full px-2 sm:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 theme-title">{t('diagnose.title')}</h1>
          <p className="text-muted-foreground text-sm lg:text-lg">{t('diagnose.subtitle')}</p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          {/* Input Section */}
          <div className="w-full flex flex-col gap-3 lg:gap-4">
            <Card className="p-4 glass w-full">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text" className="text-xs lg:text-sm">
                    <Brain className="h-4 w-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">{t('diagnose.text_input')}</span>
                    <span className="sm:hidden">Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-xs lg:text-sm">
                    <ImageIcon className="h-4 w-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">{t('diagnose.image_analysis')}</span>
                    <span className="sm:hidden">Image</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-3">
                  <div>
                    <Label htmlFor="symptoms" className="text-xs lg:text-sm">{t('diagnose.describe_symptoms')}</Label>
                    <Textarea
                      id="symptoms"
                      placeholder={t('diagnose.symptoms_placeholder')}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="mt-2 resize-none text-xs lg:text-sm min-h-[200px] lg:min-h-[308px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={!hasCredits ? () => setShowBuyCredits(true) : handleTextDiagnosis}
                      disabled={loading || (!symptoms.trim() && hasCredits)}
                      className={`flex-1 text-xs lg:text-sm h-9 lg:h-10 ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
                          <span className="hidden sm:inline">{t('diagnose.analyzing')}</span>
                          <span className="sm:hidden">Analyzing</span>
                        </>
                      ) : !hasCredits ? (
                        <>
                          <span className="hidden sm:inline">No Credits</span>
                          <span className="sm:hidden">Credits</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">{t('diagnose.analyze_symptoms')}</span>
                          <span className="sm:hidden">Analyze</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                      className="h-9 lg:h-10 w-9 lg:w-10 p-0"
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-destructive' : ''}`} />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-3">
                  <div>
                    <Label className="text-xs lg:text-sm">Upload Medical Image</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary transition-colors flex items-center justify-center h-[100px] lg:h-[184px] overflow-hidden relative ${imagePreviews.length === 1 ? 'border-primary p-0' : imagePreviews.length > 1 ? 'border-primary p-4 lg:p-6' : 'border-border p-4 lg:p-6'
                        }`}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreviews.length > 0 ? (
                        <div className={`w-full ${imagePreviews.length === 1 ? 'absolute inset-0' : 'grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-4'}`}>
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className={`relative group ${imagePreviews.length === 1 ? 'w-full h-full' : ''}`}>
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                                <p className="text-white text-sm lg:text-base font-medium">Click to change image</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-6 w-6 lg:h-8 lg:w-8 mx-auto text-muted-foreground" />
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {t('diagnose.click_upload')}
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 16MB • Max 1 image</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-symptoms" className="text-xs lg:text-sm">{t('diagnose.additional_symptoms')}</Label>
                    <Textarea
                      id="image-symptoms"
                      placeholder={t('diagnose.additional_placeholder')}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="mt-2 resize-none text-xs lg:text-sm min-h-[60px] lg:min-h-[80px]"
                    />
                  </div>
                  <Button
                    onClick={!hasCredits ? () => setShowBuyCredits(true) : handleImageDiagnosis}
                    disabled={loading || (selectedImages.length === 0 && hasCredits)}
                    className={`w-full text-xs lg:text-sm h-9 lg:h-10 ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4 animate-spin" />
                        <span className="hidden sm:inline">{t('diagnose.analyzing_image')}</span>
                        <span className="sm:hidden">Analyzing</span>
                      </>
                    ) : !hasCredits ? (
                      <>
                        <span className="hidden sm:inline">No Credits</span>
                        <span className="sm:hidden">Credits</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{t('diagnose.analyze_image')}</span>
                        <span className="sm:hidden">Analyze</span>
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Results Section */}
          {result && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-4 glass overflow-hidden">
                <div className="flex items-center justify-end mb-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const textToSpeak = result.diseases?.map((d: any) =>
                        `${d.name} with ${d.confidence}% confidence. ${d.explanation}`
                      ).join('. ') + '. ' + (result.general_advice || '');
                      speakText(textToSpeak);
                    }}
                    className="text-xs lg:text-sm h-8 lg:h-9"
                  >
                    <Volume2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">Read</span>
                  </Button>
                </div>

                <div className="space-y-4 lg:space-y-6 w-full">
                  {result.observation && (
                    <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                      <h3 className="font-semibold text-sm lg:text-base mb-2">{t('diagnose.image_observation', 'Observation')}</h3>
                      <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{result.observation}</p>
                    </Card>
                  )}

                  {result.conditions && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm lg:text-base">{t('diagnose.detected_conditions', 'Conditions')}</h3>
                      {result.conditions.map((condition: any, index: number) => (
                        <Card key={index} className="p-4 bg-muted/50">
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <h4 className="font-semibold text-xs lg:text-sm">{condition.name}</h4>
                            <span className="text-base lg:text-lg font-bold text-destructive flex-shrink-0">
                              {condition.confidence}%
                            </span>
                          </div>
                          <Progress value={condition.confidence} className="mb-3 h-1.5" />
                          <p className="text-xs text-muted-foreground">{condition.note}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.recommendation && (
                    <Alert className="text-xs lg:text-sm border-primary/20 bg-primary/5">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <strong className="text-primary">{t('diagnose.recommendation', 'Recommendation')}:</strong> {result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Diseases Grid */}
                  {result.diseases && result.diseases.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm lg:text-base">{t('diagnose.possible_diseases', 'Possible Diseases')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        {result.diseases.map((disease: any, index: number) => (
                          <Card key={index} className="p-4 bg-muted/50">
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <h3 className="font-semibold text-sm lg:text-base">{disease.name}</h3>
                              <span className="text-lg lg:text-xl font-bold text-destructive flex-shrink-0">
                                {disease.confidence}%
                              </span>
                            </div>
                            <Progress value={disease.confidence} className="mb-3 h-1.5" />
                            <p className="text-xs lg:text-sm text-muted-foreground mb-3">{disease.explanation}</p>

                            {disease.solutions && (
                              <div className="space-y-2 mb-3">
                                <p className="font-medium text-xs lg:text-sm">Solutions:</p>
                                <ul className="space-y-1.5">
                                  {disease.solutions.map((solution: string, i: number) => (
                                    <li key={i} className="text-xs flex items-start gap-2">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{solution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {disease.urgency && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <span className="text-xs font-medium">{t('diagnose.urgency_level', 'Urgency')}: </span>
                                <span className={`text-xs font-bold ${getUrgencyColor(disease.urgency)}`}>
                                  {disease.urgency}
                                </span>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer: Advice & Disclaimer */}
                  <div className="space-y-4 mt-2">
                    {result.general_advice && (
                      <Alert className="text-xs lg:text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{t('diagnose.general_advice', 'Advice:')}</strong> {result.general_advice}
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.disclaimer && (
                      <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border/50">{result.disclaimer}</p>
                    )}
                  </div>
                </div>
              </Card>
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