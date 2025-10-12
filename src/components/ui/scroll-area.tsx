import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    enablePullToRefresh?: boolean;
    onRefresh?: () => void;
  }
>(({ className, children, enablePullToRefresh = false, onRefresh, ...props }, ref) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef<number>(0);
  const isPulling = React.useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enablePullToRefresh || !onRefresh) return;

    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement && scrollElement.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || !enablePullToRefresh || !onRefresh) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, 80));
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || !enablePullToRefresh || !onRefresh) return;

    isPulling.current = false;

    if (pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={scrollRef}
        className="h-full w-full rounded-[inherit] relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {enablePullToRefresh && onRefresh && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center bg-green-50 text-green-700 text-sm py-2 transition-transform duration-200"
            style={{
              transform: `translateY(${-80 + pullDistance}px)`,
              opacity: pullDistance > 20 ? 1 : 0
            }}
          >
            {isRefreshing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                Memuat ulang...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`transition-transform ${pullDistance > 40 ? 'rotate-180' : ''}`}>
                  ↓
                </div>
                Tarik ke bawah untuk memuat ulang
              </div>
            )}
          </div>
        )}
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
