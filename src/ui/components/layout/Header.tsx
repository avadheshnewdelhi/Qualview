import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

export function Header() {
    const { setSettingsOpen, settings } = useStore();
    const hasApiKey = !!settings?.apiKey;

    return (
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Q</span>
                </div>
                <div>
                    <h1 className="text-sm font-semibold">Qualview</h1>
                    <p className="text-xs text-muted-foreground">AI Research Copilot</p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className={!hasApiKey ? 'text-destructive' : ''}
            >
                <Settings className="h-4 w-4" />
                {!hasApiKey && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
                )}
            </Button>
        </header>
    );
}
