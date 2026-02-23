import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { selectNextQuestion } from '../utils/question-selector'
import type { Question, Choice, UserData, LevelChangeResult, CorrectExplanation, WrongExplanation } from '@shared/types'

/** 正解の解説かどうかを判定 */
function isCorrectExplanation(exp: CorrectExplanation | WrongExplanation): exp is CorrectExplanation {
  return 'whyCorrect' in exp
}

/** レベルに応じた背景色を取得 */
function getLevelColor(level: number): string {
  const colors = [
    'bg-blue-100 text-blue-700',    // Lv.1
    'bg-blue-200 text-blue-800',    // Lv.2
    'bg-cyan-100 text-cyan-700',    // Lv.3
    'bg-cyan-200 text-cyan-800',    // Lv.4
    'bg-teal-100 text-teal-700',    // Lv.5
    'bg-indigo-100 text-indigo-700', // Lv.6
    'bg-indigo-200 text-indigo-800', // Lv.7
    'bg-violet-100 text-violet-700', // Lv.8
    'bg-purple-200 text-purple-800', // Lv.9
    'bg-purple-300 text-purple-900'  // Lv.10
  ]
  return colors[Math.min(level - 1, 9)] || colors[0]
}

export default function Practice(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [levelChange, setLevelChange] = useState<LevelChangeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(0)

  // 初期データ読み込み
  useEffect(() => {
    Promise.all([
      window.api.getQuestions({}),
      window.api.getUserData()
    ])
      .then(([questions, data]) => {
        setAllQuestions(questions)
        setUserData(data)
        setLoading(false)

        // URLパラメータで問題指定がある場合
        const qId = searchParams.get('questionId')
        if (qId) {
          const q = questions.find((q: Question) => q.questionId === qId)
          if (q) {
            setCurrentQuestion(q)
            setStartTime(Date.now())
            return
          }
        }

        // 次の問題を選択
        const next = selectNextQuestion(questions, data)
        if (next) {
          setCurrentQuestion(next)
          setStartTime(Date.now())
        }
      })
      .catch((err) => {
        setError(err?.message || '問題の読み込みに失敗しました')
        setLoading(false)
      })
  }, [])

  // 次の問題に進む
  const goToNextQuestion = useCallback(() => {
    if (!userData || allQuestions.length === 0) return

    setSelectedChoice(null)
    setShowExplanation(false)
    setLevelChange(null)

    const next = selectNextQuestion(allQuestions, userData)
    if (next) {
      setCurrentQuestion(next)
      setStartTime(Date.now())
    }
  }, [allQuestions, userData])

  // 選択肢をクリック
  const handleChoiceSelect = async (choiceId: string): Promise<void> => {
    if (showExplanation || !currentQuestion || !userData) return

    setSelectedChoice(choiceId)
    setShowExplanation(true)

    const choice = currentQuestion.choices.find((c) => c.id === choiceId)
    const isCorrect = choice?.isCorrect ?? false
    const timeSpent = Math.round((Date.now() - startTime) / 1000)

    try {
      const result = await window.api.recordAnswer({
        questionId: currentQuestion.questionId,
        answeredAt: new Date().toISOString(),
        selectedChoice: choiceId,
        isCorrect,
        timeSpent,
        category: currentQuestion.category,
        subcategory: currentQuestion.subcategory
      })

      setUserData(result.userData)
      if (result.levelChange.changed) {
        setLevelChange(result.levelChange)
      }
    } catch (err) {
      console.error('回答の記録に失敗:', err)
    }
  }

  if (loading) return <LoadingSpinner message="問題を読み込み中..." />
  if (error) return <ErrorMessage message={error} />
  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">練習問題</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">利用可能な問題がありません</p>
        </div>
      </div>
    )
  }

  const userLevel = userData?.levels.categories[currentQuestion.subcategory] ?? 1

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">練習問題</h2>

      {/* ヘッダー情報 */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {currentQuestion.category}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
          {currentQuestion.subcategory}
        </span>
        <span className={`px-2 py-1 rounded font-medium ${getLevelColor(userLevel)}`}>
          あなたのレベル: Lv.{userLevel}
        </span>
        <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
          問題レベル: Lv.{currentQuestion.level}
        </span>
      </div>

      {/* レベル変動通知 */}
      {levelChange && (
        <div
          className={`mb-4 p-4 rounded-xl border-2 animate-levelUp ${
            levelChange.direction === 'up'
              ? 'bg-correct-light border-correct text-correct-dark'
              : 'bg-incorrect-light border-incorrect text-incorrect-dark'
          }`}
        >
          <p className="font-bold text-lg">
            {levelChange.direction === 'up' ? '⬆️ レベルアップ！' : '⬇️ レベルダウン'}
          </p>
          <p className="text-sm mt-1">
            {levelChange.subcategory}: Lv.{levelChange.previousLevel} → Lv.{levelChange.newLevel}
          </p>
        </div>
      )}

      {/* 問題カード */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <p className="text-gray-800 leading-relaxed text-lg">{currentQuestion.question}</p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-3 mb-6">
        {currentQuestion.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            selected={selectedChoice === choice.id}
            showResult={showExplanation}
            onClick={() => handleChoiceSelect(choice.id)}
          />
        ))}
      </div>

      {/* 解説 */}
      {showExplanation && (
        <div className="space-y-4 mb-6">
          {/* 全体の解説 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">解説</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              {currentQuestion.overallExplanation.summary}
            </p>
            <div className="bg-primary-50 rounded-lg p-4 mb-3">
              <p className="text-primary-800 font-medium">
                📌 {currentQuestion.overallExplanation.keyPoint}
              </p>
            </div>
            {currentQuestion.overallExplanation.studyTip && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-3">
                <p className="text-yellow-800 text-sm">
                  💡 学習アドバイス: {currentQuestion.overallExplanation.studyTip}
                </p>
              </div>
            )}
            {currentQuestion.overallExplanation.relatedTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-gray-500">関連トピック:</span>
                {currentQuestion.overallExplanation.relatedTopics.map((topic) => (
                  <span key={topic} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 各選択肢の解説 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">各選択肢の解説</h3>
            <div className="space-y-4">
              {currentQuestion.choices.map((choice) => (
                <ChoiceExplanation key={choice.id} choice={choice} />
              ))}
            </div>
          </div>

          {/* ブックマーク・苦手問題ボタン */}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await window.api.toggleBookmark({ type: 'questions', id: currentQuestion.questionId })
                const refreshed = await window.api.getUserData()
                setUserData(refreshed)
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${
                userData?.bookmarks.questions.includes(currentQuestion.questionId)
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {userData?.bookmarks.questions.includes(currentQuestion.questionId) ? '★ ブックマーク済み' : '☆ ブックマーク'}
            </button>
            <button
              onClick={async () => {
                await window.api.toggleWeakQuestion(currentQuestion.questionId)
                const refreshed = await window.api.getUserData()
                setUserData(refreshed)
              }}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${
                userData?.weakQuestions.includes(currentQuestion.questionId)
                  ? 'bg-incorrect-light border-incorrect text-incorrect-dark'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {userData?.weakQuestions.includes(currentQuestion.questionId) ? '苦手マーク済み' : '苦手マーク'}
            </button>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={goToNextQuestion}
              className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              次の問題へ
            </button>
            <Link
              to="/resume"
              className="py-3 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
            >
              レジュメを読む
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** 選択肢ボタンコンポーネント */
function ChoiceButton({
  choice,
  selected,
  showResult,
  onClick
}: {
  choice: Choice
  selected: boolean
  showResult: boolean
  onClick: () => void
}): React.JSX.Element {
  let borderColor = 'border-gray-200 hover:border-primary-300'
  let bgColor = 'bg-white'

  if (showResult) {
    if (choice.isCorrect) {
      borderColor = 'border-correct'
      bgColor = 'bg-correct-light'
    } else if (selected && !choice.isCorrect) {
      borderColor = 'border-incorrect'
      bgColor = 'bg-incorrect-light'
    } else {
      borderColor = 'border-gray-200'
      bgColor = 'bg-white'
    }
  } else if (selected) {
    borderColor = 'border-primary-500'
    bgColor = 'bg-primary-50'
  }

  return (
    <button
      onClick={onClick}
      disabled={showResult}
      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${borderColor} ${bgColor} ${
        showResult ? 'cursor-default' : 'cursor-pointer'
      } ${showResult && choice.isCorrect ? 'animate-correct' : ''} ${showResult && selected && !choice.isCorrect ? 'animate-incorrect' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold shrink-0">
          {choice.id.toUpperCase()}
        </span>
        <span className="text-gray-800">{choice.text}</span>
        {showResult && choice.isCorrect && (
          <span className="ml-auto text-correct font-bold shrink-0">✓ 正解</span>
        )}
        {showResult && selected && !choice.isCorrect && (
          <span className="ml-auto text-incorrect font-bold shrink-0">✗</span>
        )}
      </div>
    </button>
  )
}

/** 選択肢解説コンポーネント */
function ChoiceExplanation({ choice }: { choice: Choice }): React.JSX.Element {
  const exp = choice.explanation

  return (
    <div className={`p-4 rounded-lg border ${choice.isCorrect ? 'border-correct bg-correct-light/50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="font-semibold text-sm">{choice.id.toUpperCase()}.</span>
        <span className="text-sm text-gray-700">{choice.text}</span>
        {choice.isCorrect && (
          <span className="ml-auto text-xs font-semibold text-correct">正解</span>
        )}
      </div>
      <div className="ml-5">
        {isCorrectExplanation(exp) ? (
          <>
            <p className="text-sm text-gray-700 mb-2">{exp.whyCorrect}</p>
            <p className="text-sm text-primary-700 italic mb-2">💡 {exp.analogy}</p>
            {exp.deepDive && (
              <details className="mt-2">
                <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-700">
                  さらに詳しく
                </summary>
                <p className="text-sm text-gray-600 mt-2 pl-2 border-l-2 border-primary-200">
                  {exp.deepDive}
                </p>
              </details>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700 mb-2">{exp.whyWrong}</p>
            <p className="text-sm text-primary-700 italic">💡 {exp.analogy}</p>
          </>
        )}
      </div>
    </div>
  )
}
