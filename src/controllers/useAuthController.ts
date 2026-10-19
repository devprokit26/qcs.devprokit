/**
 * Thin wrapper that delegates to the shared AuthContext.
 * Every component that calls this hook sees the SAME auth state —
 * no more divergent instances causing logout to leave a blank sidebar.
 */
export { useAuthContext as useAuthController } from '@/contexts/AuthContext';
