import { useState, useRef, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, X } from 'lucide-react';

interface EditableCardProps {
    /** Whether the card is in edit mode */
    isEditing: boolean;
    /** Toggle edit mode */
    onEditToggle: (editing: boolean) => void;
    /** Content to render inside the card */
    children: ReactNode;
    /** Optional header content (badges, titles, etc.) */
    headerContent?: ReactNode;
    /** Panel shown at bottom of card in edit mode (EditPanel) */
    editPanel?: ReactNode;
    /** Whether to show the edit icon (hide when no content yet) */
    showEditIcon?: boolean;
}

export function EditableCard({
    isEditing,
    onEditToggle,
    children,
    headerContent,
    editPanel,
    showEditIcon = true,
}: EditableCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    return (
        <Card
            ref={cardRef}
            className={`relative transition-all duration-200 ${isEditing
                    ? 'ring-2 ring-primary/30 border-primary/40'
                    : isHovered && showEditIcon
                        ? 'border-primary/20'
                        : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header with edit toggle */}
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        {headerContent}
                    </div>
                    {showEditIcon && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 transition-opacity duration-150 ${isEditing
                                    ? 'opacity-100 text-primary'
                                    : isHovered
                                        ? 'opacity-100 text-muted-foreground hover:text-primary'
                                        : 'opacity-0'
                                }`}
                            onClick={() => onEditToggle(!isEditing)}
                        >
                            {isEditing ? (
                                <X className="h-3.5 w-3.5" />
                            ) : (
                                <Pencil className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>

            {/* Card content */}
            <CardContent className="space-y-4 pt-0">
                {children}
            </CardContent>

            {/* Edit panel — only shown in edit mode */}
            {isEditing && editPanel && (
                <div className="border-t border-primary/10 bg-muted/20">
                    {editPanel}
                </div>
            )}
        </Card>
    );
}
