import { useState } from 'react';
import { useStore } from '@/store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Key } from 'lucide-react';

export function SettingsDialog() {
    const { ui, settings, setSettings, setSettingsOpen } = useStore();
    const [apiKey, setApiKey] = useState(settings?.apiKey || '');
    const [showKey, setShowKey] = useState(false);

    const handleSave = () => {
        setSettings({ apiKey, model: 'gpt-5.2' });
        setSettingsOpen(false);
    };

    const isValid = apiKey.startsWith('sk-') && apiKey.length > 20;

    return (
        <Dialog open={ui.settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your OpenAI API key to enable AI features.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        <div className="relative">
                            <Input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your API key is stored locally and never sent to our servers.
                        </p>
                    </div>

                    <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Model:</span> GPT-5.2 (latest)
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid}>
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
