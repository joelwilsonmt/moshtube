import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { useUrlSync } from './hooks/useUrlState'
import { isOutputWindow, useOutputSource } from './engine/sync'
import { OutputView } from './components/Live'

function Home() {
  useUrlSync()
  useOutputSource()
  return <Dashboard />
}

// The pop-out mirrors the main window and keeps its own URL
function Output() {
  return <OutputView />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isOutputWindow() ? <Output /> : <Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
