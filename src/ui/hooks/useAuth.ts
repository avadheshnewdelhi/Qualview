import { useState, useEffect, useCallback, useRef } from 'react';
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });
    const [authSessionId, setAuthSessionId] = useState<string>('');
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const generateId = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    useEffect(() => {
        setAuthSessionId(generateId());

        // 1. Tell Figma Main we want our saved auth token
        parent.postMessage({ pluginMessage: { type: 'GET_AUTH' } }, '*');

        // 2. Listen for the auth token coming back from Figma Main
        const handleMessage = async (event: MessageEvent) => {
            const msg = event.data.pluginMessage;
            if (msg?.type === 'AUTH_LOADED') {
                if (msg.payload?.idToken) {
                    try {
                        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                        const credential = GoogleAuthProvider.credential(msg.payload.idToken);
                        await signInWithCredential(auth, credential);
                        // The onAuthStateChanged listener below will pick up the user
                    } catch (err) {
                        console.error('Failed to restore auth from clientStorage:', err);
                        // Clear invalid token from storage
                        parent.postMessage({ pluginMessage: { type: 'CLEAR_AUTH' } }, '*');
                        setState(prev => ({ ...prev, loading: false }));
                    }
                } else {
                    setState(prev => ({ ...prev, loading: false }));
                }
            }
        };
        window.addEventListener('message', handleMessage);

        // 3. Keep the normal Firebase auth state listener active
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Save the new token anytime auth state confirms a user
                const idToken = await user.getIdToken();
                parent.postMessage({ pluginMessage: { type: 'SAVE_AUTH', payload: { idToken } } }, '*');
            }
            setState({ user, loading: false, error: null });
        });

        return () => {
            window.removeEventListener('message', handleMessage);
            unsubscribe();
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

    const startListeningForAuth = useCallback(() => {
        if (!authSessionId) return;

        setState((prev) => ({ ...prev, loading: true, error: null }));

        if (unsubscribeRef.current) unsubscribeRef.current();

        const unsubscribe = onSnapshot(doc(db, 'auth_sessions', authSessionId), async (docSnap) => {
            const data = docSnap.data();
            if (data?.idToken) {
                unsubscribe();
                try {
                    // We received the raw Google credential from the external login page!
                    const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                    const credential = GoogleAuthProvider.credential(data.idToken, data.accessToken || null);
                    await signInWithCredential(auth, credential);

                    // Save that token to client storage
                    parent.postMessage({ pluginMessage: { type: 'SAVE_AUTH', payload: { idToken: data.idToken } } }, '*');

                    // Cleanup
                    await deleteDoc(doc(db, 'auth_sessions', authSessionId));
                    setAuthSessionId(generateId());
                } catch (err) {
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: err instanceof Error ? err.message : 'Sign-in failed with token',
                    }));
                }
            }
        }, (err) => {
            console.error('Session listen error:', err);
        });

        unsubscribeRef.current = unsubscribe;

        // Timeout after 5 minutes
        setTimeout(() => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                setState(prev => prev.loading && !prev.user ? { ...prev, loading: false, error: 'Sign in timed out. Please try again.' } : prev);
            }
        }, 300000);
    }, [authSessionId]);

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
            parent.postMessage({ pluginMessage: { type: 'CLEAR_AUTH' } }, '*');
            setAuthSessionId(generateId());
        } catch (err) {
            console.error('Sign-out failed:', err);
        }
    }, []);

    return {
        user: state.user,
        loading: state.loading,
        error: state.error,
        authSessionId,
        startListeningForAuth,
        signOut,
    };
}
