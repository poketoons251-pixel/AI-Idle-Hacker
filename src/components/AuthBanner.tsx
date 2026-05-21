import React, { useEffect, useState } from 'react';
import { User, Link, LogOut } from 'lucide-react';
import {
  getAuthSession,
  onAuthStateChange,
  linkOAuthProvider,
  signOut,
  isAnonymous,
} from '../lib/supabaseAuth';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * AuthBanner — Compact auth status component for the HUD.
 *
 * Shows anonymous/linked state with link and sign-out buttons.
 * Subscribes to auth state changes for real-time updates.
 * Styled with existing cyber theme classes.
 */
export const AuthBanner: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [linking, setLinking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial session on mount
  useEffect(() => {
    let mounted = true;

    getAuthSession()
      .then((s) => {
        if (mounted) setSession(s);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });

    // Subscribe to auth state changes
    const { data } = onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        if (mounted) {
          setSession(newSession);
          setLinking(false);
          setSigningOut(false);
        }
      }
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleLinkAccount = async () => {
    setLinking(true);
    setError(null);
    try {
      const { url } = await linkOAuthProvider('google');
      if (url) {
        // Open OAuth popup window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;
        window.open(url, 'oauth-popup', `width=${width},height=${height},left=${left},top=${top}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link account');
    } finally {
      setLinking(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  };

  const anonymous = isAnonymous(session);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 border border-gray-700 rounded text-xs font-mono">
      {anonymous ? (
        <>
          <User className="w-3 h-3 text-cyber-gray-lighter flex-shrink-0" />
          <span className="text-cyber-gray-lighter">Playing as Anonymous</span>
          <button
            onClick={handleLinkAccount}
            disabled={linking}
            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/40 rounded hover:bg-cyber-primary/30 transition-colors disabled:opacity-50"
            title="Link Google account for cloud saves"
          >
            <Link className="w-3 h-3" />
            <span>{linking ? 'Linking...' : 'Link Account'}</span>
          </button>
        </>
      ) : session?.user ? (
        <>
          <User className="w-3 h-3 text-cyber-primary flex-shrink-0" />
          <span className="text-cyber-primary">
            Linked: {session.user.email ?? session.user.app_metadata?.provider ?? 'Account'}
          </span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-cyber-warning border border-cyber-warning/40 rounded hover:bg-cyber-warning/20 transition-colors disabled:opacity-50"
            title="Sign out and return to anonymous"
          >
            <LogOut className="w-3 h-3" />
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </>
      ) : (
        <>
          <User className="w-3 h-3 text-cyber-gray-lighter flex-shrink-0" />
          <span className="text-cyber-gray-lighter">Loading...</span>
        </>
      )}

      {error && (
        <span className="text-cyber-warning text-[10px]" title={error}>
          ⚠
        </span>
      )}
    </div>
  );
};
