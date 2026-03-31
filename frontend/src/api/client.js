const API_BASE = 'http://localhost:3000/api';
export async function getConcepts() {
    const res = await fetch(`${API_BASE}/concepts`);
    if (!res.ok)
        throw new Error('Failed to fetch concepts');
    return res.json();
}
export async function getConcept(id) {
    const res = await fetch(`${API_BASE}/concepts/${id}`);
    if (!res.ok)
        throw new Error('Failed to fetch concept');
    return res.json();
}
export async function submitAttempt(conceptId, audioBlob, durationSeconds) {
    const res = await fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId, audioBlob, durationSeconds })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit attempt');
    }
    return res.json();
}
export async function getConceptAttempts(conceptId) {
    const res = await fetch(`${API_BASE}/concepts/${conceptId}/attempts`);
    if (!res.ok)
        throw new Error('Failed to fetch attempts');
    return res.json();
}
export async function getAttempts(conceptId) {
    const search = conceptId ? `?conceptId=${encodeURIComponent(conceptId)}` : '';
    const res = await fetch(`${API_BASE}/attempts${search}`);
    if (!res.ok)
        throw new Error('Failed to fetch attempts');
    return res.json();
}
