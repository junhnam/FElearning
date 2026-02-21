import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import type { ResumeSection } from '@shared/types'

/** カテゴリ→チャプター→セクションのツリー構造を構築 */
function buildTree(sections: ResumeSection[]): Map<string, Map<string, ResumeSection[]>> {
  const tree = new Map<string, Map<string, ResumeSection[]>>()
  for (const section of sections) {
    if (!tree.has(section.category)) {
      tree.set(section.category, new Map())
    }
    const chapters = tree.get(section.category)!
    if (!chapters.has(section.chapter)) {
      chapters.set(section.chapter, [])
    }
    chapters.get(section.chapter)!.push(section)
  }
  return tree
}

const difficultyLabels: Record<string, { text: string; color: string }> = {
  easy: { text: '初級', color: 'bg-green-100 text-green-700' },
  medium: { text: '中級', color: 'bg-yellow-100 text-yellow-700' },
  hard: { text: '上級', color: 'bg-red-100 text-red-700' }
}

// カテゴリの表示順序
const categoryOrder = ['テクノロジ系', 'マネジメント系', 'ストラテジ系']

export default function ResumeList(): React.JSX.Element {
  const { data: sections, loading, error } = useApi(
    () => window.api.getResumeList(),
    []
  )
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(categoryOrder))
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set())

  if (loading) return <LoadingSpinner message="レジュメを読み込み中..." />
  if (error) return <ErrorMessage message={error} />
  if (!sections || sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">レジュメ</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">レジュメデータがまだありません</p>
        </div>
      </div>
    )
  }

  const tree = buildTree(sections)

  const toggleCategory = (cat: string): void => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const toggleChapter = (key: string): void => {
    setOpenChapters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">レジュメ</h2>

      <div className="space-y-3">
        {categoryOrder.map((category) => {
          const chapters = tree.get(category)
          if (!chapters) return null

          return (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* カテゴリヘッダー */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-800">{category}</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${openCategories.has(category) ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* チャプター一覧 */}
              {openCategories.has(category) && (
                <div className="border-t border-gray-100">
                  {Array.from(chapters.entries()).map(([chapter, secs]) => {
                    const chapterKey = `${category}-${chapter}`
                    return (
                      <div key={chapterKey}>
                        <button
                          onClick={() => toggleChapter(chapterKey)}
                          className="w-full pl-8 pr-5 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors border-b border-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-700">{chapter}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{secs.length}セクション</span>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${openChapters.has(chapterKey) ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* セクション一覧 */}
                        {openChapters.has(chapterKey) && (
                          <div className="bg-gray-50">
                            {secs.map((sec) => {
                              const diff = difficultyLabels[sec.difficulty] || difficultyLabels.medium
                              return (
                                <Link
                                  key={sec.sectionId}
                                  to={`/resume/${sec.sectionId}`}
                                  className="block pl-12 pr-5 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{sec.title}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${diff.color}`}>
                                      {diff.text}
                                    </span>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
