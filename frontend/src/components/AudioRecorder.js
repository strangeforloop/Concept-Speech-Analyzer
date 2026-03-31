import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);
    const mediaRecorder = useRef(null);
    const startTime = useRef(0);
    const intervalRef = useRef(null);
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
            mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
        };
    }, []);
    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            setDuration(0);
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64 = reader.result?.toString().split(',')[1];
                    if (base64) {
                        onRecordingComplete(base64, duration);
                    }
                };
            };
            recorder.start();
            mediaRecorder.current = recorder;
            startTime.current = Date.now();
            setIsRecording(true);
            intervalRef.current = window.setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime.current) / 1000));
            }, 1000);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start recording';
            setError(message);
        }
    };
    const stopRecording = () => {
        mediaRecorder.current?.stop();
        mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRecording(false);
    };
    return (_jsxs("div", { className: "space-y-3 rounded-xl bg-white p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: isRecording ? stopRecording : startRecording, className: `rounded-lg px-5 py-3 text-white ${isRecording ? 'bg-danger hover:bg-red-600' : 'bg-brand hover:bg-blue-600'}`, children: isRecording ? 'Stop Recording' : 'Start Recording' }), _jsxs("div", { className: "text-sm font-medium text-slate-700", children: ["Timer: ", duration, "s"] }), isRecording ? _jsx("div", { className: "h-3 w-3 animate-pulse rounded-full bg-danger" }) : null] }), error ? _jsx("p", { className: "text-sm text-danger", children: error }) : null] }));
}
