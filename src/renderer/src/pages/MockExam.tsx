import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Question, MockExamConfig, MockExamType } from '@shared/types'

/** 正解の解説かどうかを判定 */
function isCorrectExplanation(exp: { whyCorrect?: string }): boolean {
  return 'whyCorrect' in exp
}

const EXAM_CONFIGS: Record<MockExamType, MockExamConfig> = {
  subjectA: { type: 'subjectA', questionCount: 60, timeLimitMinutes: 90, label: '科目A 本番形式（60問/90分）' },
  subjectB: { type: 'subjectB', questionCount: 20, timeLimitMinutes: 100, label: '科目B 本番形式（20問/100分）' },
  miniA: { type: 'miniA', questionCount: 10, timeLimitMinutes: 15, label: '科目A ミニテスト（10問/15分）' },
  miniB: { type: 'miniB', questionCount: 5, timeLimitMinutes: 25, label: '科目B ミニテスト（5問/25分）' }
}

type Phase = 'select' | 'exam' | 'confirm' | 'result' | 'review'

export default function MockExam(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('select')
  const [config, setConfig] = useState<MockExamConfig | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [loading, setLoading] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // タイマー
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setPhase('result')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // 試験開始
  const startExam = useCallback(async (examType: MockExamType) => {
    setLoading(true)
    const cfg = EXAM_CONFIGS[examType]
    setConfig(cfg)

    const examFilter = examType === 'subjectA' || examType === 'miniA' ? '科目A' : '科目B'
    const allQ = await window.api.getQuestions({})
    const filtered = allQ.filter((q: Question) => q.examType === examFilter)

    // ランダムに必要数を抽出
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(cfg.questionCount, shuffled.length))

    setQuestions(selected)
    setCurrentIndex(0)
    setAnswers({})
    setFlagged(new Set())
    setRemainingSeconds(cfg.timeLimitMinutes * 60)
    setLoading(false)
    setPhase('exam')
  }, [])

  // 回答を選択
  const selectAnswer = useCallback((choiceId: string) => {
    if (questions.length === 0) return
    const qId = questions[currentIndex].questionId
    setAnswers((prev) => ({ ...prev, [qId]: choiceId }))
  }, [questions, currentIndex])

  // フラグ切り替え
  const toggleFlag = useCallback(() => {
    if (questions.length === 0) return
    const qId = questions[currentIndex].questionId
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }, [questions, currentIndex])

  // 試験終了（確認）
  const confirmFinish = useCallback(() => {
    setPhase('confirm')
  }, [])

  // 結果確定
  const finishExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    for (const q of questions) {
      const selectedChoice = answers[q.questionId]
      if (selectedChoice) {
        const choice = q.choices.find((c) => c.id === selectedChoice)
        try {
          await window.api.recordAnswer({
            questionId: q.questionId,
            answeredAt: new Date().toISOString(),
            selectedChoice,
            isCorrect: choice?.isCorrect ?? false,
            timeSpent: 0,
            category: q.category,
            subcategory: q.subcategory
          })
        } catch {
          // ignore
        }
      }
    }
    setPhase('result')
  }, [questions, answers])

  // 選択画面
  if (phase === 'select') {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">模擬試験</h2>
        <p className="text-gray-600 mb-6">試験形式を選んでください。制限時間内にすべての問題に回答しましょう。</p>
        <div className="space-y-4">
          {Object.values(EXAM_CONFIGS).map((cfg) => (
            <button
              key={cfg.type}
              onClick={() => startExam(cfg.type)}
              disabled={loading}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800">{cfg.label}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {cfg.questionCount}問 / 制限時間 {cfg.timeLimitMinutes}分
              </p>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">← ダッシュボードに戻る</Link>
        </div>
      </div>
    )
  }

  // 終了確認
  if (phase === 'confirm') {
    const unansweredCount = questions.filter((q) => !answers[q.questionId]).length
    return (
      <div className="max-w-lg mx-auto mt-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-4">試験を終了しますか？</h3>
          {unansweredCount > 0 && (
            <p className="text-incorrect mb-4">未回答の問題が {unansweredCount} 問あります。</p>
          )}
          <p className="text-sm text-gray-500 mb-6">終了すると回答が記録され、結果が表示されます。</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setPhase('exam')}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              試験に戻る
            </button>
            <button
              onClick={finishExam}
              className="px-6 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              終了して結果を見る
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 解説モード
  if (phase === 'review') {
    const q = questions[reviewIndex]
    const selectedId = answers[q.questionId]
    const selectedChoice = q.choices.find((c) => c.id === selectedId)
    const isCorrect = selectedChoice?.isCorrect ?? false

    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">解説モード</h2>
          <span className="text-sm text-gray-500">問題 {reviewIndex + 1} / {questions.length}</span>
        </div>

        {/* 正誤表示 */}
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          !selectedId ? 'bg-gray-100 text-gray-600' : isCorrect ? 'bg-correct-light text-correct-dark' : 'bg-incorrect-light text-incorrect-dark'
        }`}>
          {!selectedId ? '未回答' : isCorrect ? '正解' : '不正解'}
          {selectedId && ` — あなたの回答: ${selectedId.toUpperCase()}`}
        </div>

        {/* 擬似コード */}
        {q.pseudoCode && (
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 mb-4 overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">{q.pseudoCode}</pre>
          </div>
        )}

        {/* 問題文 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-gray-800 leading-relaxed">{q.question}</p>
        </div>

        {/* 選択肢（正誤表示付き） */}
        <div className="space-y-2 mb-4">
          {q.choices.map((choice) => {
            const isSelected = selectedId === choice.id
            let border = 'border-gray-200'
            let bg = 'bg-white'
            if (choice.isCorrect) { border = 'border-correct'; bg = 'bg-correct-light' }
            else if (isSelected) { border = 'border-incorrect'; bg = 'bg-incorrect-light' }

            return (
              <div key={choice.id} className={`p-3 rounded-xl border-2 ${border} ${bg}`}>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-sm">{choice.id.toUpperCase()}.</span>
                  <span className="text-sm text-gray-700">{choice.text}</span>
                  {choice.isCorrect && <span className="ml-auto text-correct font-bold text-xs shrink-0">正解</span>}
                  {isSelected && !choice.isCorrect && <span className="ml-auto text-incorrect font-bold text-xs shrink-0">選択</span>}
                </div>
                <div className="ml-5 mt-2 text-xs text-gray-600">
                  {isCorrectExplanation(choice.explanation)
                    ? (choice.explanation as { whyCorrect: string }).whyCorrect
                    : (choice.explanation as { whyWrong: string }).whyWrong
                  }
                </div>
              </div>
            )
          })}
        </div>

        {/* 全体解説 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-700">{q.overallExplanation.summary}</p>
          <p className="text-sm text-primary-700 mt-2 font-medium">📌 {q.overallExplanation.keyPoint}</p>
        </div>

        {/* ナビゲーション */}
        <div className="flex justify-between">
          <button
            onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
            disabled={reviewIndex === 0}
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            ← 前の問題
          </button>
          <button
            onClick={() => { setPhase('result'); setReviewIndex(0) }}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            結果に戻る
          </button>
          <button
            onClick={() => setReviewIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={reviewIndex === questions.length - 1}
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            次の問題 →
          </button>
        </div>
      </div>
    )
  }

  // 結果画面
  if (phase === 'result') {
    return (
      <ExamResult
        questions={questions}
        answers={answers}
        config={config!}
        onReview={() => { setReviewIndex(0); setPhase('review') }}
      />
    )
  }

  // 試験画面
  if (questions.length === 0) return <p className="text-gray-500">読み込み中...</p>

  const currentQ = questions[currentIndex]
  const currentAnswer = answers[currentQ.questionId]
  const isFlagged = flagged.has(currentQ.questionId)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <div className="max-w-5xl mx-auto flex gap-4">
      {/* 左サイド: ナビゲーション */}
      <div className="w-48 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sticky top-6">
          <div className={`text-center mb-3 p-2 rounded-lg font-mono text-lg font-bold ${
            remainingSeconds < 300 ? 'bg-incorrect-light text-incorrect-dark' : 'bg-gray-50 text-gray-800'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="grid grid-cols-5 gap-1 mb-3">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.questionId]
              const isFl = flagged.has(q.questionId)
              const isCurrent = i === currentIndex
              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-8 h-8 text-xs rounded flex items-center justify-center font-medium transition-colors ${
                    isCurrent ? 'bg-primary-600 text-white'
                      : isAnswered ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-500'
                  } ${isFl ? 'ring-2 ring-incorrect' : ''}`}
                  title={`問${i + 1}${isFl ? ' (フラグ)' : ''}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary-100 rounded" /> 回答済み</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 rounded ring-1 ring-incorrect" /> フラグ</div>
          </div>
          <button
            onClick={confirmFinish}
            className="w-full mt-3 py-2 text-sm bg-incorrect-light text-incorrect-dark rounded-lg font-medium hover:bg-incorrect/20 transition-colors"
          >
            試験を終了
          </button>
        </div>
      </div>

      {/* 右メイン: 問題 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">問題 {currentIndex + 1} / {questions.length}</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{currentQ.subcategory}</span>
          </div>
          <button
            onClick={toggleFlag}
            className={`text-sm px-3 py-1 rounded-lg border transition-colors ${
              isFlagged ? 'bg-incorrect-light border-incorrect text-incorrect-dark' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {isFlagged ? '🚩 フラグ済み' : '🏳️ フラグ'}
          </button>
        </div>
        {currentQ.pseudoCode && (
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 mb-4 overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">{currentQ.pseudoCode}</pre>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-gray-800 leading-relaxed text-lg">{currentQ.question}</p>
        </div>
        <div className="space-y-3 mb-4">
          {currentQ.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => selectAnswer(choice.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                currentAnswer === choice.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold shrink-0">
                  {choice.id.toUpperCase()}
                </span>
                <span className="text-gray-800">{choice.text}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← 前の問題
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIndex === questions.length - 1}
            className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            次の問題 →
          </button>
        </div>
      </div>
    </div>
  )
}

/** 結果表示コンポーネント */
function ExamResult({
  questions, answers, config, onReview
}: {
  questions: Question[]
  answers: Record<string, string>
  config: MockExamConfig
  onReview: () => void
}): React.JSX.Element {
  let correctCount = 0
  const categoryScores = new Map<string, { correct: number; total: number }>()
  for (const q of questions) {
    const selectedId = answers[q.questionId]
    const isCorrect = selectedId ? q.choices.find((c) => c.id === selectedId)?.isCorrect ?? false : false
    if (isCorrect) correctCount++
    const existing = categoryScores.get(q.subcategory) ?? { correct: 0, total: 0 }
    existing.total++
    if (isCorrect) existing.correct++
    categoryScores.set(q.subcategory, existing)
  }

  // 1000点満点スコア
  const score = Math.round((correctCount / questions.length) * 1000)
  const passed = score >= 600

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">模擬試験結果</h2>
      {/* スコアカード */}
      <div className={`rounded-xl shadow-sm border-2 p-8 mb-6 text-center ${
        passed ? 'bg-correct-light border-correct' : 'bg-incorrect-light border-incorrect'
      }`}>
        <p className="text-lg font-medium text-gray-700 mb-2">{config.label}</p>
        <p className={`text-5xl font-bold mb-1 ${passed ? 'text-correct-dark' : 'text-incorrect-dark'}`}>
          {score}<span className="text-2xl">点</span>
        </p>
        <p className="text-gray-600 mb-1">{correctCount} / {questions.length} 問正解</p>
        <p className={`text-lg font-bold mt-3 ${passed ? 'text-correct-dark' : 'text-incorrect-dark'}`}>
          {passed ? '合格ライン到達！' : '不合格ライン'}
        </p>
        <p className="text-sm text-gray-500 mt-1">（合格ライン: 600点/1000点）</p>
      </div>

      {/* カテゴリ別結果 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">カテゴリ別結果</h3>
        <div className="space-y-3">
          {Array.from(categoryScores.entries())
            .sort((a, b) => {
              const rA = a[1].total > 0 ? a[1].correct / a[1].total : 0
              const rB = b[1].total > 0 ? b[1].correct / b[1].total : 0
              return rA - rB
            })
            .map(([name, stat]) => {
              const rate = Math.round((stat.correct / stat.total) * 100)
              return (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{stat.correct}/{stat.total}問</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${rate >= 60 ? 'bg-correct' : 'bg-incorrect'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${rate >= 60 ? 'text-correct' : 'text-incorrect'}`}>
                    {rate}%
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {/* 問題一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">問題一覧</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {questions.map((q, i) => {
            const selectedId = answers[q.questionId]
            const isCorrect = selectedId ? q.choices.find((c) => c.id === selectedId)?.isCorrect ?? false : false
            const unanswered = !selectedId
            return (
              <div key={q.questionId} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  unanswered ? 'bg-gray-200 text-gray-500' : isCorrect ? 'bg-correct text-white' : 'bg-incorrect text-white'
                }`}>
                  {unanswered ? '−' : isCorrect ? '○' : '×'}
                </span>
                <span className="text-sm text-gray-600 w-10 shrink-0">問{i + 1}</span>
                <span className="text-sm text-gray-700 truncate">{q.question}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          onClick={onReview}
          className="flex-1 py-3 px-6 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          解説を見る
        </button>
        <Link
          to="/mock-exam"
          onClick={(e) => { e.preventDefault(); window.location.hash = '#/mock-exam'; window.location.reload() }}
          className="py-3 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
        >
          もう一度挑戦
        </Link>
        <Link
          to="/"
          className="py-3 px-6 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
        >
          ダッシュボードへ
        </Link>
      </div>
    </div>
  )
}
