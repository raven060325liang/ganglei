import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import PlanEdit from './pages/PlanEdit'
import FreeSetup from './pages/FreeSetup'
import Training from './pages/Training'
import Records from './pages/Records'
import Settings from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan/new" element={<PlanEdit />} />
          <Route path="/plan/:id" element={<PlanEdit />} />
          <Route path="/train/plan/:id" element={<Training />} />
          <Route path="/train/free" element={<Training free />} />
          <Route path="/free" element={<FreeSetup />} />
          <Route path="/records" element={<Records />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
