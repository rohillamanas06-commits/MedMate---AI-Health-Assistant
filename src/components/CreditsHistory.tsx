import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingDown, TrendingUp, Gift, Trash2 } from 'lucide-react';

interface Transaction {
  id: number;
  credits: number;
  type: string;
  description: string;
  created_at: string;
}

interface CreditsResponse {
  transactions: Transaction[];
}

export function CreditsHistory() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.getCreditTransactions() as CreditsResponse;
      setTransactions(response.transactions || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load transaction history',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string, credits: number) => {
    if (credits > 0) {
      return type === 'free' ? (
        <Gift className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-green-500" />
      );
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      chat: '💬 Chat Message',
      report: '📋 Report Analysis',
      image: '🖼️ Image Analysis',
      symptoms: '🔍 Symptom Check',
      purchase: '💳 Purchase',
      free: '🎁 Free Credits',
    };
    return labels[type] || type;
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await api.deleteTransaction(transactionId);
      setTransactions((prev) => prev.filter((tx) => tx.id !== transactionId));
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!confirm('Delete all transactions? This cannot be undone.')) {
      return;
    }

    try {
      const response: any = await api.deleteAllTransactions();
      setTransactions([]);
      toast({
        title: 'Success',
        description: `${response.deleted_count} transactions deleted successfully`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete transactions',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Credit Transactions</CardTitle>
          <CardDescription>Your recent credit activity</CardDescription>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={handleDeleteAllTransactions}
            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors text-muted-foreground"
            title="Delete all transactions"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-3 flex-1">
                  {getIcon(tx.type, tx.credits)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{getTypeLabel(tx.type)}</p>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-sm ${
                      tx.credits > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.credits > 0 ? '+' : ''}{tx.credits}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
