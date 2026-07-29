import { cn } from "@/lib/utils";

export function ProgressDots({
  total,
  currentIndex,
}: {
  total: number;
  currentIndex: number;
}) {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-xl items-center px-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center last:flex-none">
          <span
            className={cn(
              "block shrink-0 rounded-full",
              i < currentIndex && "h-3 w-3 bg-emerald-400",
              i === currentIndex &&
                "h-4 w-4 border-2 border-white bg-transparent",
              i > currentIndex && "h-3 w-3 border border-neutral-100/70 bg-transparent"
            )}
          />
          {i < total - 1 && (
            <span
              className={cn(
                "mx-1 h-px flex-1",
                i < currentIndex ? "bg-emerald-400" : "bg-neutral-100/50"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
