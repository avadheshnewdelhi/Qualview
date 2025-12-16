import { WifiOff } from 'lucide-react';

export function OfflineNotice() {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-xs">
            <WifiOff className="h-3 w-3" />
            <span>You're offline. Reconnect to continue using AI features.</span>
        </div>
    );
}
