import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { UserData, Question, ResumeSection } from '@shared/types'

type Tab = 'questions' | 'resume'

export default function Bookmarks(): React.JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [resumes, setResumes] = useState<ResumeSection[]>([])
  const [tab, setTab] = useState<Tab>('questions')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.api.getUserData(),
      window.api.getQuestions({}),
      window.api.getResumeList()
    ])
      .then(([data, allQ, allR]) => {
        setUserData(data)
        setQuestions(allQ)
        setResumes(allR)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  const handleRemoveBookmark = async (type: Tab, id: string): Promise<void> => {
    const bookmarkType = type === 'questions' ? 'questions' : 'resumeSections'
    const result = await window.api.toggleBookmark({ type: bookmarkType, id })
    if (userData) {
      setUserData({ ...userData, bookmarks: result.bookmarks })
    }
  }

  if (loading || !userData) {
    return <div className="max-w-4xl mx-auto"><p className="text-gray-500">読み込み中...</p></div>
  }

  const bookmarkedQuestions = questions.filter((q) =>
    userData.bookmarks.questions.includes(q.questionId)
  )
  const bookmarkedResumes = resumes.filter((r) =>
    userData.bookmarks.resumeSections.includes(r.sectionId)
  )

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ブックマーク</h2>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTab('questions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'questions' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          問題 ({bookmarkedQuestions.length})
        </button>
        <button
          onClick={() => setTab('resume')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'resume' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          レジュメ ({bookmarkedResumes.length})
        </button>
      </div>

      {tab === 'questions' && (
        <div className="space-y-3">
          {bookmarkedQuestions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">ブックマークした問題はまだありません</p>
              <p className="text-sm text-gray-400 mt-1">練習問題の解説画面からブックマークできます</p>
            </div>
          ) : (
            bookmarkedQuestions.map((q) => (
              <div key={q.questionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{q.subcategory}</span>
                      <span className="text-xs text-gray-400">Lv.{q.level}</span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/practice?questionId=${q.questionId}`}
                      className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      解く
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark('questions', q.questionId)}
                      className="text-xs px-3 py-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="ブックマークを外す"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'resume' && (
        <div className="space-y-3">
          {bookmarkedResumes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">ブックマークしたレジュメはまだありません</p>
              <p className="text-sm text-gray-400 mt-1">レジュメ詳細画面からブックマークできます</p>
            </div>
          ) : (
            bookmarkedResumes.map((r) => (
              <div key={r.sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{r.chapter}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.overview.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/resume/${r.sectionId}`}
                      className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      読む
                    </Link>
                    <button
                      onClick={() => handleRemoveBookmark('resume', r.sectionId)}
                      className="text-xs px-3 py-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="ブックマークを外す"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
