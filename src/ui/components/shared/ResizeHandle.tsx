import { useEffect, useRef, useState } from 'react';
import { postMessage } from '@/lib/figma';

// Minimum dimensions
const MIN_WIDTH = 400;
const MIN_HEIGHT = 600;

export function ResizeHandle() {
    const [isResizing, setIsResizing] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;

            const newWidth = Math.max(startSize.current.width + deltaX, MIN_WIDTH);
            const newHeight = Math.max(startSize.current.height + deltaY, MIN_HEIGHT);

            // Update the window size via Figma
            postMessage({
                type: 'RESIZE',
                payload: { width: newWidth, height: newHeight },
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        document.body.style.cursor = 'nwse-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            className="fixed bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-50 group"
            title="Drag to resize"
        >
            {/* Resize grip lines */}
            <svg
                className="w-full h-full text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
                viewBox="0 0 16 16"
                fill="none"
            >
                <path
                    d="M14 2L2 14M14 6L6 14M14 10L10 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}
