import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  currency: string;
}

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCredits: number;
}

interface PaymentOrderResponse {
  key_id: string;
  amount: number;
  order_id: string;
}

interface VerifyPaymentResponse {
  credits_added: number;
}

interface PackagesResponse {
  packages: CreditPackage[];
}

// Helper function to load Razorpay script
const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        reject(new Error('Razorpay failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.head.appendChild(script);
  });
};

export function BuyCreditsModal({ isOpen, onClose, onSuccess, currentCredits }: BuyCreditsModalProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
      // Load Razorpay script when modal opens
      loadRazorpayScript().catch((error) => {
        console.error('Failed to load Razorpay:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment gateway. Please try again.',
          variant: 'destructive',
        });
      });
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await api.getCreditPackages() as PackagesResponse;
      setPackages(response.packages || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load credit packages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageData: CreditPackage) => {
    try {
      setProcessingPackage(packageData.id);

      // Ensure Razorpay script is loaded
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Payment gateway not available');
      }

      // Create payment order
      const orderResponse = await api.createPaymentOrder(packageData.id) as PaymentOrderResponse;
      
      const razorpayOptions = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: 'INR',
        name: 'MedMate',
        description: `${packageData.credits} Credits`,
        order_id: orderResponse.order_id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await api.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            ) as VerifyPaymentResponse;

            toast({
              title: 'Success',
              description: `Successfully added ${verifyResponse.credits_added} credits!`,
            });

            onSuccess();
            onClose();
          } catch (error) {
            toast({
              title: 'Error',
              description: error instanceof Error ? error.message : 'Payment verification failed',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payment order',
        variant: 'destructive',
      });
    } finally {
      setProcessingPackage(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            You currently have {currentCredits} credit(s). Purchase more to continue using our services.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg)}
                disabled={processingPackage === pkg.id}
                className="p-4 border rounded-lg flex justify-between items-center hover:border-primary transition-colors cursor-pointer hover:bg-primary/5"
              >
                <div className="text-left">
                  <h4 className="font-semibold text-lg">{pkg.credits} Credits</h4>
                  <p className="text-sm text-muted-foreground">{pkg.name}</p>
                </div>
                <div className="font-bold text-lg">₹{pkg.price}</div>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={processingPackage !== null}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
