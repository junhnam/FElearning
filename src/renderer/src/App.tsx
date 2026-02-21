import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ResumeList from './pages/ResumeList'
import ResumeDetail from './pages/ResumeDetail'
import Practice from './pages/Practice'
import Progress from './pages/Progress'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'

function App(): React.JSX.Element {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resume" element={<ResumeList />} />
          <Route path="/resume/:sectionId" element={<ResumeDetail />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
