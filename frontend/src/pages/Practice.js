import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AudioRecorder } from '../components/AudioRecorder';
import { getConcept, getConceptAttempts, submitAttempt } from '../api/client';
export function Practice() {
    const { id } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [showTranscript, setShowTranscript] = useState(true);
    const [activeTab, setActiveTab] = useState('practice');
    const { data: concept, isLoading, error } = useQuery({
        queryKey: ['concept', id],
        queryFn: () => getConcept(id ?? ''),
        enabled: Boolean(id)
    });
    const submitMutation = useMutation({
        mutationFn: ({ audioBlob, duration }) => submitAttempt(id ?? '', audioBlob, duration),
        onSuccess: (result) => {
            setAttempt(result);
            setActiveTab('history');
        }
    });
    const historyQuery = useQuery({
        queryKey: ['attempts', id],
        queryFn: () => getConceptAttempts(id ?? ''),
        enabled: Boolean(id)
    });
    const onRecordingComplete = (audioBlob, duration) => {
        submitMutation.mutate({ audioBlob, duration });
    };
    const reset = () => {
        setAttempt(null);
        setShowTranscript(true);
        submitMutation.reset();
    };
    if (isLoading) {
        return _jsx("main", { className: "mx-auto max-w-4xl p-8", children: "Loading concept..." });
    }
    if (error || !concept) {
        return (_jsxs("main", { className: "mx-auto max-w-4xl p-8", children: [_jsx("p", { className: "text-danger", children: "Failed to load concept." }), _jsx(Link, { to: "/", className: "mt-4 inline-block text-brand", children: "Back to Concepts" })] }));
    }
    return (_jsxs("main", { className: "mx-auto max-w-4xl space-y-6 px-4 py-8", children: [_jsx(Link, { to: "/", className: "text-brand", children: "Back to Concepts" }), _jsxs("section", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("h1", { className: "mb-2 text-2xl font-bold", children: concept.topic }), _jsx("p", { className: "text-lg text-slate-700", children: concept.generated_prompt })] }), _jsxs("section", { className: "flex gap-2 rounded-xl bg-white p-2 shadow-sm", children: [_jsx("button", { type: "button", onClick: () => setActiveTab('practice'), className: `rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'practice' ? 'bg-brand text-white' : 'text-slate-700'}`, children: "Practice" }), _jsx("button", { type: "button", onClick: () => setActiveTab('history'), className: `rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'bg-brand text-white' : 'text-slate-700'}`, children: "History" })] }), activeTab === 'practice' ? (_jsxs(_Fragment, { children: [_jsx(AudioRecorder, { onRecordingComplete: onRecordingComplete }), submitMutation.isPending ? (_jsxs("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: [_jsx("div", { className: "mb-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" }), _jsx("p", { children: "Processing..." })] })) : null, submitMutation.isError ? (_jsx("div", { className: "rounded-xl bg-red-50 p-4 text-danger", children: submitMutation.error.message })) : null] })) : null, activeTab === 'history' ? (_jsxs("section", { className: "space-y-4", children: [historyQuery.isLoading ? (_jsx("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: "Loading attempt history..." })) : null, historyQuery.isError ? (_jsx("div", { className: "rounded-xl bg-red-50 p-4 text-danger", children: "Failed to load attempt history." })) : null, !historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.length ?? 0) === 0 ? (_jsx("div", { className: "rounded-xl bg-white p-6 shadow-sm", children: "No attempts yet for this concept." })) : null, historyQuery.data?.map((item) => (_jsxs("article", { className: "space-y-3 rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm text-slate-500", children: new Date(item.attemptedAt * 1000).toLocaleString() }), _jsxs("div", { className: "text-2xl font-bold text-brand", children: [item.aiAnalysis.score, "/10"] })] }), _jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [_jsx("h3", { className: "mb-2 font-semibold", children: "Transcription" }), _jsx("p", { className: "whitespace-pre-wrap text-sm text-slate-700", children: item.transcription })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold text-success", children: "Strengths" }), _jsx("ul", { className: "space-y-1", children: item.aiAnalysis.strengths.map((strength) => (_jsxs("li", { className: "text-sm text-slate-700", children: ["\u2705 ", strength] }, strength))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold text-warning", children: "Gaps" }), _jsx("ul", { className: "space-y-1", children: item.aiAnalysis.gaps.map((gap) => (_jsxs("li", { className: "text-sm text-slate-700", children: ["\u26A0\uFE0F ", gap] }, gap))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold", children: "Follow-up Questions" }), _jsx("ul", { className: "space-y-1", children: item.aiAnalysis.followUpQuestions.map((question) => (_jsx("li", { className: "text-sm text-brand", children: question }, question))) })] })] }, item.id)))] })) : null, activeTab === 'practice' && attempt ? (_jsxs("section", { className: "space-y-4 rounded-xl bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-[72px] font-bold leading-none text-brand", children: attempt.aiAnalysis.score }), _jsx("div", { className: "text-slate-600", children: "/ 10" })] }), _jsx("button", { type: "button", className: "text-sm text-brand", onClick: () => setShowTranscript((v) => !v), children: showTranscript ? 'Hide transcription' : 'Show transcription' }), showTranscript ? (_jsxs("div", { className: "rounded-lg bg-slate-50 p-4", children: [_jsx("h3", { className: "mb-2 font-semibold", children: "Transcription" }), _jsx("p", { className: "whitespace-pre-wrap text-sm text-slate-700", children: attempt.transcription })] })) : null, _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold text-success", children: "Strengths" }), _jsx("ul", { className: "space-y-1", children: attempt.aiAnalysis.strengths.map((item) => (_jsxs("li", { className: "text-sm text-slate-700", children: ["\u2705 ", item] }, item))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold text-warning", children: "Gaps" }), _jsx("ul", { className: "space-y-1", children: attempt.aiAnalysis.gaps.map((item) => (_jsxs("li", { className: "text-sm text-slate-700", children: ["\u26A0\uFE0F ", item] }, item))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "mb-2 font-semibold", children: "Follow-up Questions" }), _jsx("ul", { className: "space-y-2", children: attempt.aiAnalysis.followUpQuestions.map((item) => (_jsx("li", { children: _jsx("button", { type: "button", className: "text-left text-brand underline", children: item }) }, item))) })] }), _jsx("button", { type: "button", onClick: reset, className: "rounded-lg bg-brand px-4 py-2 text-white hover:bg-blue-600", children: "Try Again" })] })) : null] }));
}
