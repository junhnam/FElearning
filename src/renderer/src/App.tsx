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
import Onboarding from './pages/Onboarding'
import type { UserData } from '@shared/types'

function App(): React.JSX.Element {
  const [themeReady, setThemeReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // テーマ・フォントサイズの適用 + オンボーディング判定
  useEffect(() => {
    window.api.getUserData().then((data) => {
      applyTheme(data)

      // 初回起動判定: 回答履歴なし かつ レベルが全て未設定（初期値のまま）
      const catLevels = Object.values(data.levels.categories)
      const isNew = data.questionHistory.length === 0
        && (catLevels.length === 0 || catLevels.every((v) => v === 1))
        && data.streaks.currentStreak === 0
        && data.streaks.maxStreak === 0
      if (isNew) setShowOnboarding(true)

      setThemeReady(true)
    }).catch(() => {
      setThemeReady(true)
    })

    // 設定変更ポーリング
    const interval = setInterval(async () => {
      try {
        const data = await window.api.getUserData()
        applyTheme(data)
      } catch {
        // ignore
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleOnboardingComplete = async (initialLevel: number): Promise<void> => {
    // 全カテゴリに初期レベルを設定
    const data = await window.api.getUserData()
    const categories = await window.api.getCategories()
    const newCatLevels: Record<string, number> = {}
    for (const cat of categories) {
      newCatLevels[cat.name] = initialLevel
    }
    await window.api.saveUserData({
      levels: { ...data.levels, overall: initialLevel, categories: newCatLevels }
    })
    setShowOnboarding(false)
  }

  if (!themeReady) return <div />

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="flex h-screen bg-gray-50 transition-colors">
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

function applyTheme(data: UserData): void {
  if (data.settings.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  const sizeMap = { small: '14px', medium: '16px', large: '18px' }
  document.documentElement.style.fontSize = sizeMap[data.settings.fontSize] || '16px'
}

export default App
