import { Star } from 'lucide-react';

export function ImportanceStars({ importance }: { importance: number }) {
  const score = Math.min(Math.max(importance, 1), 5);

  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`重要性 ${score} 星`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${index < score ? 'fill-current' : 'text-amber-200'}`}
        />
      ))}
    </span>
  );
}
