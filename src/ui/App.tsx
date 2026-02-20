import { useEffect } from 'react';
import { useStore } from '@/store';
import { Header } from '@/components/layout/Header';
import { StepIndicator } from '@/components/layout/StepIndicator';
import { MainContent } from '@/components/layout/MainContent';
import { OfflineNotice } from '@/components/shared/OfflineNotice';
import { SettingsDialog } from '@/components/shared/SettingsDialog';
import { ResizeHandle } from '@/components/shared/ResizeHandle';
import { postMessage } from '@/lib/figma';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';

export default function App() {
    const { initializeFromFigma, setFileType, setSignedIn } = useStore();
    const isOnline = useOnlineStatus();
    const { user } = useAuth();

    // Sync Firebase auth state → store
    useEffect(() => {
        setSignedIn(!!user);
    }, [user, setSignedIn]);

    useEffect(() => {
        // Request initial data from Figma
        postMessage({ type: 'GET_PERSISTED_STATE' });
        postMessage({ type: 'GET_SELECTION' });
        postMessage({ type: 'GET_FILE_TYPE' });

        // Listen for messages from Figma
        const handleMessage = (event: MessageEvent) => {
            const msg = event.data.pluginMessage;
            if (!msg) return;

            switch (msg.type) {
                case 'STATE_LOADED':
                    if (msg.payload) {
                        initializeFromFigma(msg.payload);
                    }
                    break;
                case 'FILE_TYPE':
                    setFileType(msg.payload);
                    break;
                case 'SELECTION_CHANGED':
                    useStore.getState().setCanvasSelection(msg.payload);
                    break;
                case 'OBJECT_INSERTED':
                    // Handle canvas insertion confirmation
                    break;
                case 'ERROR':
                    useStore.getState().setError(msg.payload.message);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [initializeFromFigma, setFileType]);

    return (
        <div className="flex flex-col h-screen relative">
            <Header />
            {!isOnline && <OfflineNotice />}
            <StepIndicator />
            <MainContent />
            <SettingsDialog />
            <ResizeHandle />
        </div>
    );
}
