import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the supabase client before importing supabaseAuth
const mockSignInAnonymously = vi.fn();
const mockLinkIdentity = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: mockSignInAnonymously,
      linkIdentity: mockLinkIdentity,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

describe('supabaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signInAnonymously', () => {
    it('returns a session with is_anonymous = true on success', async () => {
      const mockSession = {
        user: { id: 'anon-123', is_anonymous: true },
        access_token: 'token',
      };
      mockSignInAnonymously.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { signInAnonymously } = await import('../lib/supabaseAuth');
      const result = await signInAnonymously();

      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('throws with descriptive message on error', async () => {
      mockSignInAnonymously.mockResolvedValue({
        data: { session: null },
        error: { message: 'Network error' },
      });

      const { signInAnonymously } = await import('../lib/supabaseAuth');

      await expect(signInAnonymously()).rejects.toThrow('Failed to sign in anonymously: Network error');
    });
  });

  describe('linkOAuthProvider', () => {
    it('calls linkIdentity with the specified provider and returns url', async () => {
      const mockUrl = 'https://oauth-provider-url';
      mockLinkIdentity.mockResolvedValue({ data: { url: mockUrl }, error: null });

      const { linkOAuthProvider } = await import('../lib/supabaseAuth');
      const result = await linkOAuthProvider('google');

      expect(mockLinkIdentity).toHaveBeenCalledWith({ provider: 'google' });
      expect(result).toEqual({ url: mockUrl });
    });

    it('throws with descriptive message on error', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: { url: null },
        error: { message: 'Provider not configured' },
      });

      const { linkOAuthProvider } = await import('../lib/supabaseAuth');

      await expect(linkOAuthProvider('github')).rejects.toThrow('Failed to link GitHub account: Provider not configured');
    });
  });

  describe('signOut', () => {
    it('calls signOut then signInAnonymously to restore anonymous session', async () => {
      const mockAnonSession = {
        user: { id: 'new-anon-456', is_anonymous: true },
        access_token: 'new-token',
      };
      mockSignOut.mockResolvedValue({ error: null });
      mockSignInAnonymously.mockResolvedValue({ data: { session: mockAnonSession }, error: null });

      const { signOut } = await import('../lib/supabaseAuth');
      const result = await signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(result).toEqual(mockAnonSession);
    });

    it('throws if signOut fails', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

      const { signOut } = await import('../lib/supabaseAuth');

      await expect(signOut()).rejects.toThrow('Failed to sign out: Sign out failed');
    });
  });

  describe('getAuthSession', () => {
    it('returns session object when signed in', async () => {
      const mockSession = {
        user: { id: 'user-789', is_anonymous: false, email: 'test@example.com' },
        access_token: 'token',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { getAuthSession } = await import('../lib/supabaseAuth');
      const result = await getAuthSession();

      expect(mockGetSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('returns null when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      // Need to re-import to get fresh module after previous test
      vi.resetModules();
      // Re-setup mocks after reset
      const { getAuthSession } = await import('../lib/supabaseAuth');
      const result = await getAuthSession();

      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes to auth state changes and returns subscription for cleanup', async () => {
      const mockCallback = vi.fn();
      const mockSubscription = { data: { subscription: { unsubscribe: vi.fn() } } };
      mockOnAuthStateChange.mockImplementation((cb) => {
        cb('SIGNED_IN', { user: { id: 'user-123' } });
        return mockSubscription;
      });

      const { onAuthStateChange } = await import('../lib/supabaseAuth');
      const result = onAuthStateChange(mockCallback);

      expect(mockOnAuthStateChange).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', expect.objectContaining({ user: expect.any(Object) }));
      expect(result).toBe(mockSubscription);
    });
  });

  describe('isAnonymous', () => {
    it('returns true when session user is_anonymous', async () => {
      const { isAnonymous } = await import('../lib/supabaseAuth');
      const session = { user: { id: 'anon-123', is_anonymous: true } } as any;

      expect(isAnonymous(session)).toBe(true);
    });

    it('returns false when session user is not anonymous', async () => {
      const { isAnonymous } = await import('../lib/supabaseAuth');
      const session = { user: { id: 'user-456', is_anonymous: false } } as any;

      expect(isAnonymous(session)).toBe(false);
    });

    it('returns false when session is null', async () => {
      const { isAnonymous } = await import('../lib/supabaseAuth');

      expect(isAnonymous(null)).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('returns user id when session exists', async () => {
      const { getUserId } = await import('../lib/supabaseAuth');
      const session = { user: { id: 'user-789' } } as any;

      expect(getUserId(session)).toBe('user-789');
    });

    it('returns null when session is null', async () => {
      const { getUserId } = await import('../lib/supabaseAuth');

      expect(getUserId(null)).toBeNull();
    });
  });
});
