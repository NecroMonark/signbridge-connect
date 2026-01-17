import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionStats {
  total_gestures: number;
  recent_letters: string[];
  started_at: string | null;
  last_active_at: string | null;
  session_duration_minutes: number;
  is_active: boolean;
}

interface UseSessionReturn {
  sessionId: string | null;
  sessionToken: string | null;
  stats: SessionStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const SESSION_STORAGE_KEY = 'signbridge_session';

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or retrieve session
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check for existing session in localStorage
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          // Check if session is less than 24 hours old
          const createdAt = new Date(parsed.created_at).getTime();
          const now = Date.now();
          const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
          
          if (hoursSinceCreation < 24) {
            setSessionId(parsed.session_id);
            setSessionToken(parsed.session_token);
            console.log('Using existing session:', parsed.session_id);
            setIsLoading(false);
            return;
          }
        }

        // Create new session
        console.log('Creating new session...');
        const { data, error: invokeError } = await supabase.functions.invoke('create-session', {
          body: {}
        });

        if (invokeError) {
          throw new Error(invokeError.message);
        }

        if (data?.success) {
          const sessionData = {
            session_id: data.session_id,
            session_token: data.session_token,
            created_at: data.created_at
          };
          
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
          setSessionId(data.session_id);
          setSessionToken(data.session_token);
          console.log('New session created:', data.session_id);
        } else {
          throw new Error('Failed to create session');
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
        
        // Create a fallback local session ID for offline use
        const fallbackId = `local_${crypto.randomUUID()}`;
        setSessionId(fallbackId);
        setSessionToken(fallbackId);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // Refresh stats from server
  const refreshStats = useCallback(async () => {
    if (!sessionId || sessionId.startsWith('local_')) {
      return;
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('get-session-stats', {
        body: {},
        headers: {}
      });

      // Note: get-session-stats uses query params, need to use a different approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-session-stats?session_id=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing stats:', err);
    }
  }, [sessionId]);

  // Auto-refresh stats every 30 seconds when session is active
  useEffect(() => {
    if (!sessionId || sessionId.startsWith('local_')) return;

    // Initial fetch
    refreshStats();

    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [sessionId, refreshStats]);

  return {
    sessionId,
    sessionToken,
    stats,
    isLoading,
    error,
    refreshStats
  };
}
