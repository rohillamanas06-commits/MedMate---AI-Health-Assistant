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
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Diagnose() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const handleTextDiagnosis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter your symptoms');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response: any = await api.diagnose(symptoms);
      setResult(response.result);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDiagnosis = async () => {
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response: any = await api.diagnoseImage(selectedImage, symptoms);
      setResult(response.result);
      toast.success('Image analysis complete!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 gradient-text">AI Medical Diagnosis</h1>
          <p className="text-muted-foreground text-lg">
            Describe your symptoms or upload an image for instant AI analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6 glass animate-fade-in">
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Brain className="h-4 w-4 mr-2" />
                    Text Input
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="symptoms">Describe Your Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="e.g., I have a headache, fever, and sore throat for 2 days..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTextDiagnosis} disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze Symptoms
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={startVoiceRecognition}
                      disabled={isListening}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label>Upload Medical Image</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${
                        imagePreview ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(null);
                              setImagePreview('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 16MB</p>
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
                    <Label htmlFor="image-symptoms">Additional Symptoms (Optional)</Label>
                    <Textarea
                      id="image-symptoms"
                      placeholder="Any additional context about the image..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleImageDiagnosis} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Medical Disclaimer:</strong> This AI diagnosis is for informational purposes
                only. Always consult with a healthcare professional for medical advice.
              </AlertDescription>
            </Alert>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result ? (
              <div className="space-y-4 animate-scale-in">
                <Card className="p-6 glass">
                  <h2 className="text-2xl font-bold mb-4">Diagnosis Results</h2>
                  
                  {result.diseases?.map((disease: any, index: number) => (
                    <Card key={index} className="p-4 mb-4 bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{disease.name}</h3>
                        <span className="text-2xl font-bold text-primary">
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
                          <span className="text-sm font-medium">Urgency Level: </span>
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
                        <strong>General Advice:</strong> {result.general_advice}
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
                <Brain className="h-24 w-24 mx-auto mb-4 text-muted-foreground opacity-30 animate-float" />
                <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                <p className="text-muted-foreground">
                  Enter your symptoms or upload an image to get started
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
