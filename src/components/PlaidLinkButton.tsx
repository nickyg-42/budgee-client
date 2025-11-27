import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface PlaidLinkButtonProps {
  onSuccess: (publicToken: string) => void;
  onExit?: () => void;
}

export const PlaidLinkButton = ({ onSuccess, onExit }: PlaidLinkButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const createLinkToken = useCallback(async () => {
    try {
      const response = await apiService.createLinkToken();
      setLinkToken(response.link_token);
    } catch (error) {
      console.error('Failed to create link token:', error);
      toast.error('Failed to initialize bank connection');
      throw error;
    }
  }, []);

  const onPlaidSuccess = useCallback((public_token: string, metadata: any) => {
    onSuccess(public_token);
  }, [onSuccess]);

  const onPlaidExit = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      toast.error('Bank connection cancelled or failed');
    }
    onExit?.();
  }, [onExit]);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  };

  const { open, ready } = usePlaidLink(config);

  const handleClick = async () => {
    if (!linkToken) {
      try {
        setIsLoading(true);
        await createLinkToken();
      } catch (error) {
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    if (ready) {
      open();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || (!linkToken && !ready)}
      className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span>Connect Bank Account</span>
        </>
      )}
    </button>
  );
};