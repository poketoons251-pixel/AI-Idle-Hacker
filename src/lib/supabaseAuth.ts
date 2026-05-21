import { supabase } from './supabase';
import type {
  AuthChangeEvent,
  Session,
  Provider,
} from '@supabase/supabase-js';

/**
 * Supabase Auth Service — Anonymous-first authentication flow.
 *
 * Per D-01: Players start playing immediately (no signup wall).
 * When they want cloud saves, they link a Google/GitHub account.
 * Sign out returns to anonymous, not logged-out state.
 */

/**
 * Sign in anonymously — the default entry point for all players.
 * Returns the session on success, throws on failure.
 */
export async function signInAnonymously(): Promise<Session> {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error(`Failed to sign in anonymously: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('Failed to sign in anonymously: No session returned');
  }

  return data.session;
}

/**
 * Link an OAuth provider (google or github) to the current anonymous session.
 * Converts the anonymous user to a permanent user.
 * Returns { url } for the OAuth redirect.
 */
export async function linkOAuthProvider(
  provider: 'google' | 'github'
): Promise<{ url: string | undefined }> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: provider as Provider,
  });

  if (error) {
    const providerName = provider === 'google' ? 'Google' : 'GitHub';
    throw new Error(`Failed to link ${providerName} account: ${error.message}`);
  }

  return { url: data?.url };
}

/**
 * Sign out and immediately restore an anonymous session.
 * Per D-01: sign out returns to anonymous, not logged-out state.
 */
export async function signOut(): Promise<Session> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }

  // Immediately restore anonymous session
  return signInAnonymously();
}

/**
 * Get the current auth session.
 * Returns the session object when signed in, null when no session exists.
 */
export async function getAuthSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get auth session: ${error.message}`);
  }

  return data.session;
}

/**
 * Subscribe to auth state changes.
 * Returns the subscription object for cleanup (call subscription.unsubscribe()).
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { data: { subscription: { unsubscribe: () => void } } } {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Check if the current session is anonymous.
 * Returns true if session exists and user.is_anonymous is true.
 */
export function isAnonymous(session: Session | null): boolean {
  return session?.user?.is_anonymous === true;
}

/**
 * Get the current user's ID from the session.
 * Returns the user ID string or null if no session.
 */
export function getUserId(session: Session | null): string | null {
  return session?.user?.id ?? null;
}
