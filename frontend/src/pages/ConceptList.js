import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getConcepts } from '../api/client';
import { ConceptCard } from '../components/ConceptCard';
export function ConceptList() {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
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
    return (_jsxs("main", { className: "mx-auto max-w-6xl px-4 py-8", children: [_jsx("h1", { className: "mb-6 text-3xl font-bold", children: "Concept Practice" }), _jsx("section", { className: "mb-6 rounded-xl bg-slate-100 p-4", children: _jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [_jsxs("select", { value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), className: "rounded-md border border-slate-300 bg-white px-3 py-2", children: [_jsx("option", { value: "all", children: "All categories" }), categories.map((category) => (_jsx("option", { value: category, children: category }, category)))] }), _jsxs("select", { value: difficultyFilter, onChange: (e) => setDifficultyFilter(e.target.value), className: "rounded-md border border-slate-300 bg-white px-3 py-2", children: [_jsx("option", { value: "all", children: "All difficulties" }), _jsx("option", { value: "mid", children: "mid" }), _jsx("option", { value: "senior", children: "senior" }), _jsx("option", { value: "staff", children: "staff" })] }), _jsxs("label", { className: "flex items-center gap-2 rounded-md bg-white px-3 py-2", children: [_jsx("input", { type: "checkbox", checked: showOnlyNew, onChange: (e) => setShowOnlyNew(e.target.checked) }), "Show only not attempted"] })] }) }), isLoading ? (_jsx("div", { className: "rounded-xl bg-white p-8 text-center shadow-sm", children: "Loading concepts..." })) : null, error ? (_jsx("div", { className: "rounded-xl bg-red-50 p-8 text-center text-danger shadow-sm", children: "Failed to load concepts." })) : null, !isLoading && !error && (filteredConcepts?.length ?? 0) === 0 ? (_jsx("div", { className: "rounded-xl bg-white p-8 text-center shadow-sm", children: "No concepts match your filters." })) : null, _jsx("section", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: filteredConcepts?.map((concept) => (_jsx(ConceptCard, { concept: concept, onClick: () => navigate(`/practice/${concept.id}`) }, concept.id))) })] }));
}
