import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-elevated/70", className)}
      {...props}
    />
  );
}

export function ChannelCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-surface-border/50 bg-surface p-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl bg-surface-secondary/60 p-8 sm:h-[540px]">
      <div className="flex h-full flex-col justify-end max-w-xl space-y-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function HorizontalRowSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-56 shrink-0 sm:w-64">
            <ChannelCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

