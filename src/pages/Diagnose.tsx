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
  Coins,
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
      const response: any = await api.diagnoseImage(selectedImages[0], symptoms);
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
      // Calculate how many more images we can add
      const remainingSlots = 5 - selectedImages.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length === 0) {
        toast.error('Maximum 5 images already selected');
        e.target.value = ''; // Reset input
        return;
      }

      // Add new files to existing ones
      const newImages = [...selectedImages, ...filesToAdd];
      setSelectedImages(newImages);

      // Generate previews for new images
      const newPreviews: string[] = [];
      let loadedCount = 0;

      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === filesToAdd.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });

      if (files.length > remainingSlots) {
        toast.info(`Added ${filesToAdd.length} image(s). Maximum 5 images allowed.`);
      } else {
        toast.success(`Added ${filesToAdd.length} image(s)`);
      }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-8">
      <div className="container max-w-6xl">
        <div className="mb-8 px-4 text-center">
          <h1 className="text-4xl font-bold mb-3 gradient-text leading-tight">
            {t('diagnose.title')}
          </h1>
          <p className="text-muted-foreground text-lg px-2">
            {t('diagnose.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6 glass">
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Brain className="h-4 w-4 mr-2" />
                    {t('diagnose.text_input')}
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {t('diagnose.image_analysis')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="symptoms">{t('diagnose.describe_symptoms')}</Label>
                    <Textarea
                      id="symptoms"
                      placeholder={t('diagnose.symptoms_placeholder')}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="min-h-[200px] mt-2 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={!hasCredits ? () => setShowBuyCredits(true) : handleTextDiagnosis} disabled={loading || (!symptoms.trim() && hasCredits)} className={`flex-1 ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('diagnose.analyzing')}
                        </>
                      ) : !hasCredits ? (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          No Credits Available
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          {t('diagnose.analyze_symptoms')}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-destructive' : ''}`} />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label>Upload Medical Images (Max 5)</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${imagePreviews.length > 0 ? 'border-primary' : 'border-border'
                        }`}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 shadow-md hover:scale-105 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1}/{imagePreviews.length}
                              </div>
                            </div>
                          ))}
                          {imagePreviews.length < 5 && (
                            <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                              <div className="text-center">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">{t('diagnose.add_more')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {t('diagnose.click_upload')}
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 16MB • Max 5 images</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-symptoms">{t('diagnose.additional_symptoms')}</Label>
                    <Textarea
                      id="image-symptoms"
                      placeholder={t('diagnose.additional_placeholder')}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="mt-2 resize-none"
                    />
                  </div>
                  <Button onClick={!hasCredits ? () => setShowBuyCredits(true) : handleImageDiagnosis} disabled={loading || (selectedImages.length === 0 && hasCredits)} className={`w-full ${!hasCredits ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('diagnose.analyzing_image')}
                      </>
                    ) : !hasCredits ? (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        No Credits Available
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {t('diagnose.analyze_image')}
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 scrollable-content">
            {result ? (
              <div className="space-y-4">
                <Card className="p-6 glass">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{t('diagnose.results', 'Diagnosis Results')}</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const textToSpeak = result.diseases?.map((d: any) =>
                          `${d.name} with ${d.confidence}% confidence. ${d.explanation}`
                        ).join('. ') + '. ' + (result.general_advice || '');
                        speakText(textToSpeak);
                      }}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Read Aloud
                    </Button>
                  </div>

                  {/* Image Analysis Results */}
                  {result.observation && (
                    <Card className="p-4 mb-4 bg-blue-500/10 border-blue-500/20">
                      <h3 className="font-semibold text-lg mb-2">{t('diagnose.image_observation', 'Image Observation')}</h3>
                      <p className="text-sm text-muted-foreground">{result.observation}</p>
                    </Card>
                  )}

                  {result.conditions && (
                    <div className="space-y-4 mb-4">
                      <h3 className="font-semibold text-lg">{t('diagnose.detected_conditions', 'Detected Conditions')}</h3>
                      {result.conditions.map((condition: any, index: number) => (
                        <Card key={index} className="p-4 bg-muted/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{condition.name}</h4>
                            <span className="text-xl font-bold text-destructive">
                              {condition.confidence}%
                            </span>
                          </div>
                          <Progress value={condition.confidence} className="mb-2" />
                          <p className="text-sm text-muted-foreground">{condition.note}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.recommendation && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('diagnose.recommendation', 'Recommendation')}:</strong> {result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.professional_evaluation && (
                    <Alert className="mb-4" variant={result.professional_evaluation === 'Required' ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('diagnose.professional_eval', 'Professional Evaluation')}:</strong> {result.professional_evaluation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Text Diagnosis Results */}
                  {result.diseases?.map((disease: any, index: number) => (
                    <Card key={index} className="p-4 mb-4 bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{disease.name}</h3>
                        <span className="text-2xl font-bold text-destructive">
                          {disease.confidence}%
                        </span>
                      </div>
                      <Progress value={disease.confidence} className="mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">{disease.explanation}</p>

                      {disease.solutions && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Recommended Solutions:</p>
                          <ul className="space-y-1">
                            {disease.solutions.map((solution: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {disease.urgency && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm font-medium">{t('diagnose.urgency_level', 'Urgency Level:')} </span>
                          <span className={`text-sm font-bold ${getUrgencyColor(disease.urgency)}`}>
                            {disease.urgency}
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}

                  {result.general_advice && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{t('diagnose.general_advice', 'General Advice:')}</strong> {result.general_advice}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.disclaimer && (
                    <p className="text-xs text-muted-foreground mt-4">{result.disclaimer}</p>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center glass">
                <Brain className="h-24 w-24 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground">
                  Enter your symptoms or upload an image to get started
                </p>

              </Card>
            )}
          </div>
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
