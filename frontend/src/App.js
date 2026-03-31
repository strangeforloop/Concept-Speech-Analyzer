import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConceptList } from './pages/ConceptList';
import { Practice } from './pages/Practice';
const queryClient = new QueryClient();
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(ConceptList, {}) }), _jsx(Route, { path: "/practice/:id", element: _jsx(Practice, {}) })] }) }) }));
}
export default App;
