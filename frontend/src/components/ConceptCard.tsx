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
      className="w-full rounded-xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <h3 className="mb-3 text-lg font-semibold">{concept.topic}</h3>
      <div className="mb-4 flex gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {concept.category}
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
          {concept.difficulty}
        </span>
      </div>
      <p className="text-sm text-slate-600">
        Attempts: <span className="font-semibold">{concept.attempt_count ?? 0}</span>
      </p>
    </button>
  );
}
