import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/Dashboard'
import { useUrlState } from './hooks/useUrlState'
import { isOutputWindow, useOutputSource } from './engine/sync'
import { OutputView } from './components/Live'

function Home() {
  useUrlState()
  useOutputSource()
  return <Dashboard />
}

function Output() {
  useUrlState({ write: false })
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
