import { cn } from '@/lib/utils';

export function AppCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-center text-xs text-muted-foreground', className)}>
      Dikembangkan oleh Dean Putra · 2026
    </p>
  );
}
