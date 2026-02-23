import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import type { UserData, Question, CategoryDefinition } from '@shared/types'

/** カテゴリ別の正答率を計算 */
function getCategoryAccuracy(
  userData: UserData
): { name: string; correct: number; total: number; rate: number }[] {
  const stats = new Map<string, { correct: number; total: number }>()

  for (const record of userData.questionHistory) {
    const existing = stats.get(record.subcategory) ?? { correct: 0, total: 0 }
    existing.total++
    if (record.isCorrect) existing.correct++
    stats.set(record.subcategory, existing)
  }

  return Array.from(stats.entries())
    .map(([name, { correct, total }]) => ({
      name,
      correct,
      total,
      rate: Math.round((correct / total) * 100)
    }))
    .sort((a, b) => a.rate - b.rate)
}

/** 推定合格率を簡易計算 */
function getEstimatedPassRate(userData: UserData): number {
  if (userData.questionHistory.length < 10) return 0

  const correct = userData.questionHistory.filter((h) => h.isCorrect).length
  const rate = correct / userData.questionHistory.length

  // 正答率 60% がボーダー。80%以上で合格率90%、60%で50%、40%以下で10%
  if (rate >= 0.8) return 90
  if (rate >= 0.7) return 70 + (rate - 0.7) * 200
  if (rate >= 0.6) return 50 + (rate - 0.6) * 200
  if (rate >= 0.4) return 10 + (rate - 0.4) * 200
  return 10
}

/** アドバイスを生成 */
function getRecommendations(
  userData: UserData,
  categories: CategoryDefinition[]
): string[] {
  const recommendations: string[] = []

  if (userData.questionHistory.length === 0) {
    recommendations.push('まずは練習問題を解いてみましょう！')
    return recommendations
  }

  // 苦手カテゴリの提案
  if (userData.weakQuestions.length > 3) {
    recommendations.push(`苦手マークが ${userData.weakQuestions.length} 問あります。重点的に復習しましょう。`)
  }

  // 低レベルカテゴリの提案
  const lowLevelCats = categories.filter(
    (c) => (userData.levels.categories[c.name] ?? 1) <= 2
  )
  if (lowLevelCats.length > 0) {
    const names = lowLevelCats.slice(0, 3).map((c) => c.name).join('、')
    recommendations.push(`${names} のレベルが低めです。レジュメを読んで基礎を固めましょう。`)
  }

  // 連続学習の提案
  if (userData.streaks.currentStreak >= 3) {
    recommendations.push(`${userData.streaks.currentStreak}日連続学習中！その調子です。`)
  } else if (userData.streaks.currentStreak === 0) {
    recommendations.push('今日から学習を始めましょう！連続学習でモチベーション維持！')
  }

  // 正答率による提案
  const totalCorrect = userData.questionHistory.filter((h) => h.isCorrect).length
  const overallRate = totalCorrect / userData.questionHistory.length
  if (overallRate >= 0.7) {
    recommendations.push('正答率が高いです！模擬試験に挑戦してみましょう。')
  } else if (overallRate < 0.5) {
    recommendations.push('レジュメで知識を整理してから問題に取り組むと効果的です。')
  }

  return recommendations.slice(0, 3)
}

export default function Dashboard(): React.JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.api.getUserData(),
      window.api.getQuestions({}),
      window.api.getCategories()
    ])
      .then(([data, questions, cats]) => {
        setUserData(data)
        setAllQuestions(questions)
        setCategories(cats)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  if (loading || !userData) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  const totalAnswered = userData.questionHistory.length
  const totalCorrect = userData.questionHistory.filter((h) => h.isCorrect).length
  const overallRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
  const passRate = getEstimatedPassRate(userData)
  const categoryAccuracy = getCategoryAccuracy(userData)
  const recommendations = getRecommendations(userData, categories)

  // レーダーチャート用データ（科目Aカテゴリのレベル）
  const subjectACategories = categories.filter((c) => c.examType === '科目A')
  const radarData = subjectACategories.map((cat) => ({
    category: cat.name.length > 6 ? cat.name.slice(0, 6) + '…' : cat.name,
    level: userData.levels.categories[cat.name] ?? 1,
    fullMark: 10
  }))

  // 苦手カテゴリ（正答率が低い上位3つ）
  const weakCategories = categoryAccuracy.filter((c) => c.total >= 3).slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">
            {userData.levels.overall}
          </p>
          <p className="text-sm text-gray-500 mt-1">総合レベル</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{totalAnswered}</p>
          <p className="text-sm text-gray-500 mt-1">回答数</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className={`text-3xl font-bold ${overallRate >= 60 ? 'text-correct' : 'text-incorrect'}`}>
            {overallRate}%
          </p>
          <p className="text-sm text-gray-500 mt-1">正答率</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">
            {userData.streaks.currentStreak}
          </p>
          <p className="text-sm text-gray-500 mt-1">連続学習日数</p>
        </div>
      </div>

      {/* レーダーチャート + 推定合格率 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* レーダーチャート */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">科目A カテゴリ別レベル</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar
                  name="レベル"
                  dataKey="level"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">データがありません</p>
          )}
        </div>

        {/* 推定合格率 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">推定合格率</h3>
          {totalAnswered >= 10 ? (
            <div className="flex flex-col items-center justify-center h-[280px]">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={passRate >= 60 ? '#22c55e' : '#f97316'}
                    strokeWidth="8"
                    strokeDasharray={`${passRate * 2.51} ${251 - passRate * 2.51}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${passRate >= 60 ? 'text-correct' : 'text-incorrect'}`}>
                    {Math.round(passRate)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {passRate >= 70 ? '合格圏内です！' : passRate >= 50 ? 'もう少しです！' : '基礎固めを続けましょう'}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-gray-400 text-center">
                10問以上回答すると推定合格率が表示されます
                <br />
                <span className="text-sm">（現在 {totalAnswered}/10問）</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 苦手カテゴリ + アドバイス */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 苦手カテゴリ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">苦手カテゴリ</h3>
          {weakCategories.length > 0 ? (
            <div className="space-y-3">
              {weakCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${cat.rate >= 60 ? 'bg-correct' : 'bg-incorrect'}`}
                        style={{ width: `${cat.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${cat.rate >= 60 ? 'text-correct' : 'text-incorrect'}`}>
                    {cat.rate}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              {totalAnswered === 0 ? '問題を解くとここに表示されます' : '苦手カテゴリはありません'}
            </p>
          )}
        </div>

        {/* アドバイス */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">学習アドバイス</h3>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary-500 shrink-0 mt-0.5">▸</span>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/practice"
          className="bg-primary-50 rounded-xl border border-primary-200 p-4 hover:bg-primary-100 transition-colors text-center"
        >
          <p className="text-2xl mb-1">📝</p>
          <p className="text-sm font-medium text-primary-700">問題を解く</p>
        </Link>
        <Link
          to="/resume"
          className="bg-primary-50 rounded-xl border border-primary-200 p-4 hover:bg-primary-100 transition-colors text-center"
        >
          <p className="text-2xl mb-1">📖</p>
          <p className="text-sm font-medium text-primary-700">レジュメを読む</p>
        </Link>
        <Link
          to="/mock-exam"
          className="bg-primary-50 rounded-xl border border-primary-200 p-4 hover:bg-primary-100 transition-colors text-center"
        >
          <p className="text-2xl mb-1">🎯</p>
          <p className="text-sm font-medium text-primary-700">模擬試験</p>
        </Link>
        <Link
          to="/progress"
          className="bg-primary-50 rounded-xl border border-primary-200 p-4 hover:bg-primary-100 transition-colors text-center"
        >
          <p className="text-2xl mb-1">📊</p>
          <p className="text-sm font-medium text-primary-700">学習進捗</p>
        </Link>
      </div>
    </div>
  )
}
