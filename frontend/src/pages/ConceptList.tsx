import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getConcepts } from '../api/client';
import { ConceptCard } from '../components/ConceptCard';

export function ConceptList() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const navigate = useNavigate();

  const { data: concepts, isLoading, error } = useQuery({
    queryKey: ['concepts'],
    queryFn: getConcepts
  });

  const categories = useMemo(() => {
    return Array.from(new Set(concepts?.map((concept) => concept.category) ?? [])).sort();
  }, [concepts]);

  const filteredConcepts = concepts?.filter((concept) => {
    const categoryMatch = categoryFilter === 'all' || concept.category === categoryFilter;
    const difficultyMatch = difficultyFilter === 'all' || concept.difficulty === difficultyFilter;
    const onlyNewMatch = !showOnlyNew || (concept.attempt_count ?? 0) === 0;
    return categoryMatch && difficultyMatch && onlyNewMatch;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Concept Practice</h1>

      <section className="mb-6 rounded-xl bg-slate-100 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            <option value="all">All difficulties</option>
            <option value="mid">mid</option>
            <option value="senior">senior</option>
            <option value="staff">staff</option>
          </select>

          <label className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={showOnlyNew}
              onChange={(e) => setShowOnlyNew(e.target.checked)}
            />
            Show only not attempted
          </label>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">Loading concepts...</div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-red-50 p-8 text-center text-danger shadow-sm">
          Failed to load concepts.
        </div>
      ) : null}

      {!isLoading && !error && (filteredConcepts?.length ?? 0) === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          No concepts match your filters.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {filteredConcepts?.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            onClick={() => navigate(`/practice/${concept.id}`)}
          />
        ))}
      </section>
    </main>
  );
}
