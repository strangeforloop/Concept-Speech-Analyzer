import type { Concept } from '../types';

interface ConceptCardProps {
  concept: Concept;
  onClick: () => void;
}

export function ConceptCard({ concept, onClick }: ConceptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-primary-200 hover:shadow-md"
    >
      <h3 className="mb-3 text-lg font-semibold text-neutral-800">{concept.topic}</h3>
      <div className="mb-4 flex gap-2">
        <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-500">
          {concept.category}
        </span>
        <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-400">
          {concept.difficulty}
        </span>
      </div>
      <p className="text-sm text-neutral-500">
        Attempts: <span className="font-semibold">{concept.attempt_count ?? 0}</span>
      </p>
    </button>
  );
}
