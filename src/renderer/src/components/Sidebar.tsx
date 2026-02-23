import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const navItems = [
  { path: '/', label: 'ダッシュボード', icon: 'HomeIcon' },
  { path: '/resume', label: 'レジュメ', icon: 'BookIcon' },
  { path: '/practice', label: '練習問題', icon: 'PenIcon' },
  { path: '/progress', label: '学習進捗', icon: 'ChartIcon' },
  { path: '/mock-exam', label: '模擬試験', icon: 'ExamIcon' },
  { path: '/bookmarks', label: 'ブックマーク', icon: 'BookmarkIcon' },
  { path: '/settings', label: '設定', icon: 'SettingsIcon' }
]

// シンプルなSVGアイコンコンポーネント
function NavIcon({ type, className }: { type: string; className?: string }): React.JSX.Element {
  const cls = className || 'w-5 h-5'
  switch (type) {
    case 'HomeIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    case 'BookIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    case 'PenIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    case 'ChartIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    case 'BookmarkIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    case 'ExamIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    case 'SettingsIcon':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return <span className={cls}>?</span>
  }
}

export default function Sidebar(): React.JSX.Element {
  const [overallLevel, setOverallLevel] = useState(1)

  useEffect(() => {
    window.api.getUserData().then((data) => {
      setOverallLevel(data.levels.overall)
    }).catch(() => {
      // データ取得失敗時はデフォルト値を維持
    })
  }, [])

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* アプリタイトル */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary-600">FE Master</h1>
        <p className="text-xs text-gray-500 mt-1">基本情報技術者試験 対策</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">総合レベル:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
            Lv.{overallLevel}
          </span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <NavIcon type={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">FE Master v1.0</p>
      </div>
    </aside>
  )
}
