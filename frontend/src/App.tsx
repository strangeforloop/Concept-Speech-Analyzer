import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConceptList } from './pages/ConceptList';
import { Practice } from './pages/Practice';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ConceptList />} />
          <Route path="/practice/:id" element={<Practice />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
