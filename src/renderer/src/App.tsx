import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ResumeList from './pages/ResumeList'
import ResumeDetail from './pages/ResumeDetail'
import Practice from './pages/Practice'
import Progress from './pages/Progress'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'
import MockExam from './pages/MockExam'

function App(): React.JSX.Element {
  const [themeReady, setThemeReady] = useState(false)

  // テーマとフォントサイズの適用
  useEffect(() => {
    window.api.getUserData().then((data) => {
      // ダークモード
      if (data.settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // フォントサイズ
      const sizeMap = { small: '14px', medium: '16px', large: '18px' }
      document.documentElement.style.fontSize = sizeMap[data.settings.fontSize] || '16px'

      setThemeReady(true)
    }).catch(() => {
      setThemeReady(true)
    })

    // 設定変更を監視（ストレージイベント的なポーリング）
    const interval = setInterval(async () => {
      try {
        const data = await window.api.getUserData()
        if (data.settings.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        const sizeMap = { small: '14px', medium: '16px', large: '18px' }
        document.documentElement.style.fontSize = sizeMap[data.settings.fontSize] || '16px'
      } catch {
        // ignore
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (!themeReady) return <div />

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
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
          <Route path="/mock-exam" element={<MockExam />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
