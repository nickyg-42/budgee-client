import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface PlaidLinkButtonProps {
  onSuccess: (publicToken: string) => void;
  onExit?: () => void;
}

export const PlaidLinkButton = ({ onSuccess, onExit }: PlaidLinkButtonProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create link token when component mounts
  useEffect(() => {
    const createLinkToken = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.createLinkToken();
        setLinkToken(response.link_token);
      } catch (error) {
        console.error('Failed to create link token:', error);
        toast.error('Failed to initialize bank connection');
      } finally {
        setIsLoading(false);
      }
    };
    createLinkToken();
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

  const onPlaidEvent = useCallback((eventName: string, metadata: any) => {
    // Log Plaid Link events for debugging
    console.log('Plaid Link event:', eventName, metadata);
  }, []);

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
    onEvent: onPlaidEvent,
  };

  const { open, ready } = usePlaidLink(config);

  const handleClick = () => {
    if (ready && linkToken) {
      open();
    } else if (!linkToken && !isLoading) {
      // If no token exists, create one first
      const createToken = async () => {
        try {
          setIsLoading(true);
          const response = await apiService.createLinkToken();
          setLinkToken(response.link_token);
          // The usePlaidLink hook will automatically reconfigure with the new token
          // When ready becomes true, the next button click will open it
        } catch (error) {
          console.error('Failed to create link token:', error);
          toast.error('Failed to initialize bank connection');
        } finally {
          setIsLoading(false);
        }
      };
      createToken();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
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