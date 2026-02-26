import { Routes, Route, Navigate } from 'react-router-dom';
import { RepoProvider } from './context/RepoContext.jsx';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  return (
    <RepoProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RepoProvider>
  );
}

export default App;
