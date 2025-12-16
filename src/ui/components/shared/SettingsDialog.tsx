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
    const [model, setModel] = useState<'gpt-4o' | 'gpt-4-turbo'>(
        settings?.model || 'gpt-4o'
    );

    const handleSave = () => {
        setSettings({ apiKey, model });
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

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model</label>
                        <div className="flex gap-2">
                            <Button
                                variant={model === 'gpt-4o' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setModel('gpt-4o')}
                                className="flex-1"
                            >
                                GPT-4o
                            </Button>
                            <Button
                                variant={model === 'gpt-4-turbo' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setModel('gpt-4-turbo')}
                                className="flex-1"
                            >
                                GPT-4 Turbo
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            GPT-4o is recommended for best results.
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
