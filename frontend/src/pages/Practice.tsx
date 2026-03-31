import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AudioRecorder } from '../components/AudioRecorder';
import { getConcept, getConceptAttempts, submitAttempt } from '../api/client';
import type { Attempt } from '../types';

export function Practice() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

  const { data: concept, isLoading, error } = useQuery({
    queryKey: ['concept', id],
    queryFn: () => getConcept(id ?? ''),
    enabled: Boolean(id)
  });

  const submitMutation = useMutation({
    mutationFn: ({ audioBlob, duration }: { audioBlob: string; duration: number }) =>
      submitAttempt(id ?? '', audioBlob, duration),
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

  const onRecordingComplete = (audioBlob: string, duration: number) => {
    submitMutation.mutate({ audioBlob, duration });
  };

  const reset = () => {
    setAttempt(null);
    setShowTranscript(true);
    submitMutation.reset();
  };

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-8">Loading concept...</main>;
  }

  if (error || !concept) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-danger">Failed to load concept.</p>
        <Link to="/" className="mt-4 inline-block text-brand">
          Back to Concepts
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link to="/" className="text-brand">
        Back to Concepts
      </Link>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">{concept.topic}</h1>
        <p className="text-lg text-slate-700">{concept.generated_prompt}</p>
      </section>

      <section className="flex gap-2 rounded-xl bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === 'practice' ? 'bg-brand text-white' : 'text-slate-700'
          }`}
        >
          Practice
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            activeTab === 'history' ? 'bg-brand text-white' : 'text-slate-700'
          }`}
        >
          History
        </button>
      </section>

      {activeTab === 'practice' ? (
        <>
      <AudioRecorder onRecordingComplete={onRecordingComplete} />

      {submitMutation.isPending ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
          <p>Processing...</p>
        </div>
      ) : null}

      {submitMutation.isError ? (
        <div className="rounded-xl bg-red-50 p-4 text-danger">
          {(submitMutation.error as Error).message}
        </div>
      ) : null}
        </>
      ) : null}

      {activeTab === 'history' ? (
        <section className="space-y-4">
          {historyQuery.isLoading ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">Loading attempt history...</div>
          ) : null}
          {historyQuery.isError ? (
            <div className="rounded-xl bg-red-50 p-4 text-danger">Failed to load attempt history.</div>
          ) : null}
          {!historyQuery.isLoading && !historyQuery.isError && (historyQuery.data?.length ?? 0) === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">No attempts yet for this concept.</div>
          ) : null}

          {historyQuery.data?.map((item) => (
            <article key={item.id} className="space-y-3 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {new Date(item.attemptedAt * 1000).toLocaleString()}
                </p>
                <div className="text-2xl font-bold text-brand">{item.aiAnalysis.score}/10</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold">Transcription</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{item.transcription}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-success">Strengths</h3>
                <ul className="space-y-1">
                  {item.aiAnalysis.strengths.map((strength) => (
                    <li key={strength} className="text-sm text-slate-700">
                      ✅ {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-warning">Gaps</h3>
                <ul className="space-y-1">
                  {item.aiAnalysis.gaps.map((gap) => (
                    <li key={gap} className="text-sm text-slate-700">
                      ⚠️ {gap}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">Follow-up Questions</h3>
                <ul className="space-y-1">
                  {item.aiAnalysis.followUpQuestions.map((question) => (
                    <li key={question} className="text-sm text-brand">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'practice' && attempt ? (
        <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="text-[72px] font-bold leading-none text-brand">{attempt.aiAnalysis.score}</div>
            <div className="text-slate-600">/ 10</div>
          </div>

          <button
            type="button"
            className="text-sm text-brand"
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? 'Hide transcription' : 'Show transcription'}
          </button>

          {showTranscript ? (
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="mb-2 font-semibold">Transcription</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{attempt.transcription}</p>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 font-semibold text-success">Strengths</h3>
            <ul className="space-y-1">
              {attempt.aiAnalysis.strengths.map((item) => (
                <li key={item} className="text-sm text-slate-700">
                  ✅ {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-warning">Gaps</h3>
            <ul className="space-y-1">
              {attempt.aiAnalysis.gaps.map((item) => (
                <li key={item} className="text-sm text-slate-700">
                  ⚠️ {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Follow-up Questions</h3>
            <ul className="space-y-2">
              {attempt.aiAnalysis.followUpQuestions.map((item) => (
                <li key={item}>
                  <button type="button" className="text-left text-brand underline">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-blue-600"
          >
            Try Again
          </button>
        </section>
      ) : null}
    </main>
  );
}
