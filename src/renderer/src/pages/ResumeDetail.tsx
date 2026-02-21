import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import type { ResumeSection } from '@shared/types'
import { useEffect } from 'react'

export default function ResumeDetail(): React.JSX.Element {
  const { sectionId } = useParams<{ sectionId: string }>()

  const { data: section, loading, error } = useApi(
    () => window.api.getResumeSection(sectionId!),
    [sectionId]
  )

  // セクションを閲覧済みにする
  useEffect(() => {
    if (section) {
      window.api.saveUserData({
        resumeProgress: {
          [section.sectionId]: {
            status: 'read',
            readAt: new Date().toISOString()
          }
        }
      }).catch(console.error)
    }
  }, [section])

  if (loading) return <LoadingSpinner message="レジュメを読み込み中..." />
  if (error) return <ErrorMessage message={error} />
  if (!section) {
    return <ErrorMessage message="レジュメセクションが見つかりません" />
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* パンくずリスト */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link to="/resume" className="hover:text-primary-600 transition-colors">レジュメ</Link>
        <span>/</span>
        <span>{section.category}</span>
        <span>/</span>
        <span>{section.chapter}</span>
        <span>/</span>
        <span className="text-gray-800">{section.title}</span>
      </nav>

      {/* タイトル */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{section.title}</h2>

      {/* たとえ話付き概要 */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-lg">💡</span>
          <p className="text-primary-800 font-medium leading-relaxed">
            {section.overview.analogy}
          </p>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed ml-8">
          {section.overview.summary}
        </p>
      </div>

      {/* コンテンツ */}
      <div className="space-y-6 mb-8">
        {section.content.map((block, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{block.heading}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{block.body}</p>
            {block.diagram && (
              <div
                className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                dangerouslySetInnerHTML={{ __html: block.diagram }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 重要用語リスト */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">重要用語</h3>
        <div className="space-y-4">
          {section.keyTerms.map((term, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-primary-700 whitespace-nowrap">{term.term}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{term.definition}</p>
              <p className="text-sm text-primary-600 mt-1 italic">
                💡 {term.analogy}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 関連問題 */}
      {section.relatedQuestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">関連問題</h3>
          <div className="flex flex-wrap gap-2">
            {section.relatedQuestions.map((qId) => (
              <Link
                key={qId}
                to={`/practice?questionId=${qId}`}
                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 transition-colors"
              >
                {qId}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 戻るボタン */}
      <div className="mb-8">
        <Link
          to="/resume"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          レジュメ一覧に戻る
        </Link>
      </div>
    </div>
  )
}
