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
  const [receivedRedirectUri, setReceivedRedirectUri] = useState<string | null>(null);
  const [shouldOpenWhenReady, setShouldOpenWhenReady] = useState(false);
  const [mountLink, setMountLink] = useState(false);

  const restoreScroll = useCallback(() => {
    try {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    } catch {}
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_state_id')) {
      const storedToken = localStorage.getItem('plaid_link_token');
      if (storedToken) {
        setLinkToken(storedToken);
      }
      setReceivedRedirectUri(window.location.href);
      setMountLink(true);
      setShouldOpenWhenReady(true);
    }
  }, []);

  const onPlaidSuccess = useCallback((public_token: string, metadata: any) => {
    localStorage.removeItem('plaid_link_token');
    restoreScroll();
    onSuccess(public_token);
  }, [onSuccess, restoreScroll]);

  const onPlaidExit = useCallback((err: any, metadata: any) => {
    if (err) {
      toast.error('Bank connection cancelled or failed');
    }
    restoreScroll();
    onExit?.();
  }, [onExit, restoreScroll]);

  const onPlaidEvent = useCallback((eventName: string, metadata: any) => {
    if (eventName === 'OPEN') {
      try {
        
      } catch {}
    }
    if (eventName === 'EXIT' || eventName === 'HANDOFF' || eventName === 'SUCCESS') {
      restoreScroll();
    }
  }, [restoreScroll]);

  const LinkInstance = ({ token, uri, autoOpen }: { token: string | null; uri: string | null; autoOpen: boolean }) => {
    const { open, ready } = usePlaidLink({
      token,
      onSuccess: onPlaidSuccess,
      onExit: onPlaidExit,
      onEvent: onPlaidEvent,
      receivedRedirectUri: uri,
    });

    useEffect(() => {
      if (ready && token && (uri || autoOpen)) {
        open();
        setShouldOpenWhenReady(false);
      }
    }, [ready, token, uri, autoOpen, open]);

    useEffect(() => {
      return () => {
        // Defensive: restore scroll on unmount
        restoreScroll();
      };
    }, [restoreScroll]);

    return (
      <button
        onClick={() => open()}
        disabled={isLoading || !ready || !token}
        className="inline-flex items-center px-4 py-2 rounded-full border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
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

  const handleClick = () => {
    if (!linkToken && !isLoading) {
      setShouldOpenWhenReady(true);
      const createToken = async () => {
        try {
          setIsLoading(true);
          const response = await apiService.createLinkToken();
          setLinkToken(response.link_token);
          localStorage.setItem('plaid_link_token', response.link_token);
          setMountLink(true);
        } catch (error) {
          toast.error('Failed to initialize bank connection');
        } finally {
          setIsLoading(false);
        }
      };
      createToken();
    } else if (linkToken && !mountLink) {
      setMountLink(true);
      setShouldOpenWhenReady(true);
    }
  };

  return mountLink ? (
    <LinkInstance token={linkToken} uri={receivedRedirectUri} autoOpen={shouldOpenWhenReady} />
  ) : (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 rounded-full border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
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
