import { useStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';

export function SettingsDialog() {
    const { ui, setSettingsOpen } = useStore();
    const { user, loading, error, authSessionId, startListeningForAuth, signOut } = useAuth();

    return (
        <Dialog open={ui.settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Settings
                    </DialogTitle>
                    <DialogDescription>
                        Sign in to enable AI features and cloud sync.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Auth Section */}
                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : user ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        className="h-10 w-10 rounded-full"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        {(user.displayName || user.email || '?')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={signOut}
                                className="w-full"
                            >
                                <LogOut className="h-3.5 w-3.5 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                asChild
                                className="w-full"
                                size="lg"
                                onClick={startListeningForAuth}
                            >
                                <a
                                    href={`https://qualview-plugin.web.app/login.html?session=${authSessionId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Sign in with Google
                                </a>
                            </Button>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Sign in to unlock AI-powered research features and cloud sync.
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-destructive text-center">{error}</p>
                    )}

                    {/* Model info */}
                    <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Model:</span> GPT-5.2 (latest)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">Sync:</span>{' '}
                            {user ? 'Cloud enabled' : 'Local only'}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
