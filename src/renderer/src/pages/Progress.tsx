import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import type { UserData, CategoryDefinition } from '@shared/types'

const PIE_COLORS = ['#22c55e', '#f97316']

export default function Progress(): React.JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.api.getUserData(),
      window.api.getCategories()
    ])
      .then(([data, cats]) => {
        setUserData(data)
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

  // カテゴリ別統計
  const categoryStats = new Map<string, { correct: number; total: number; level: number }>()
  for (const cat of categories) {
    categoryStats.set(cat.name, {
      correct: 0,
      total: 0,
      level: userData.levels.categories[cat.name] ?? 1
    })
  }
  for (const record of userData.questionHistory) {
    const existing = categoryStats.get(record.subcategory)
    if (existing) {
      existing.total++
      if (record.isCorrect) existing.correct++
    } else {
      categoryStats.set(record.subcategory, {
        correct: record.isCorrect ? 1 : 0,
        total: 1,
        level: userData.levels.categories[record.subcategory] ?? 1
      })
    }
  }

  // 科目A / 科目B 別統計
  const subjectACategories = categories.filter((c) => c.examType === '科目A')
  const subjectBCategories = categories.filter((c) => c.examType === '科目B')

  const subjectAStats = subjectACategories
    .map((cat) => {
      const stat = categoryStats.get(cat.name)
      return {
        name: cat.name.length > 8 ? cat.name.slice(0, 8) + '…' : cat.name,
        fullName: cat.name,
        correct: stat?.correct ?? 0,
        total: stat?.total ?? 0,
        rate: stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        level: stat?.level ?? 1
      }
    })
    .sort((a, b) => b.rate - a.rate)

  const subjectBStats = subjectBCategories
    .map((cat) => {
      const stat = categoryStats.get(cat.name)
      return {
        name: cat.name.length > 8 ? cat.name.slice(0, 8) + '…' : cat.name,
        fullName: cat.name,
        correct: stat?.correct ?? 0,
        total: stat?.total ?? 0,
        rate: stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
        level: stat?.level ?? 1
      }
    })
    .sort((a, b) => b.rate - a.rate)

  // 正解・不正解の円グラフデータ
  const pieData = totalAnswered > 0
    ? [
        { name: '正解', value: totalCorrect },
        { name: '不正解', value: totalAnswered - totalCorrect }
      ]
    : []

  // 最近の学習日ヒストリー（直近7日）
  const recentDays = getRecentDayStats(userData)

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">学習進捗</h2>

      {totalAnswered === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">まだ回答がありません</p>
          <p className="text-sm text-gray-400 mt-1">練習問題を解くとここに進捗が表示されます</p>
        </div>
      ) : (
        <>
          {/* 全体サマリー */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{totalAnswered}</p>
              <p className="text-xs text-gray-500 mt-1">総回答数</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-correct">{totalCorrect}</p>
              <p className="text-xs text-gray-500 mt-1">正解数</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${overallRate >= 60 ? 'text-correct' : 'text-incorrect'}`}>
                {overallRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">正答率</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{userData.streaks.currentStreak}</p>
              <p className="text-xs text-gray-500 mt-1">連続学習</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{userData.streaks.maxStreak}</p>
              <p className="text-xs text-gray-500 mt-1">最長連続</p>
            </div>
          </div>

          {/* 正答率 円グラフ + 直近7日の推移 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">正解/不正解</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">直近7日間の回答数</h3>
              {recentDays.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={recentDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="回答数" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-12">直近7日間のデータがありません</p>
              )}
            </div>
          </div>

          {/* 科目A カテゴリ別正答率 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">科目A カテゴリ別正答率</h3>
            <div className="space-y-3">
              {subjectAStats.map((stat) => (
                <div key={stat.fullName} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-medium text-gray-700 truncate" title={stat.fullName}>
                      {stat.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Lv.{stat.level} | {stat.correct}/{stat.total}問
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${stat.rate >= 60 ? 'bg-correct' : stat.total > 0 ? 'bg-incorrect' : 'bg-gray-300'}`}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${stat.rate >= 60 ? 'text-correct' : stat.total > 0 ? 'text-incorrect' : 'text-gray-400'}`}>
                    {stat.total > 0 ? `${stat.rate}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 科目B カテゴリ別正答率 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">科目B カテゴリ別正答率</h3>
            <div className="space-y-3">
              {subjectBStats.map((stat) => (
                <div key={stat.fullName} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-medium text-gray-700 truncate" title={stat.fullName}>
                      {stat.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Lv.{stat.level} | {stat.correct}/{stat.total}問
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${stat.rate >= 60 ? 'bg-correct' : stat.total > 0 ? 'bg-incorrect' : 'bg-gray-300'}`}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${stat.rate >= 60 ? 'text-correct' : stat.total > 0 ? 'text-incorrect' : 'text-gray-400'}`}>
                    {stat.total > 0 ? `${stat.rate}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 苦手問題 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">苦手問題</h3>
            <p className="text-sm text-gray-500 mb-4">
              苦手マークした問題: {userData.weakQuestions.length}問
            </p>
            {userData.weakQuestions.length > 0 ? (
              <p className="text-sm text-gray-600">
                苦手マークされた問題は練習時に優先的に出題されます。
                ブックマーク画面から個別の問題を確認できます。
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                苦手な問題があれば、解説画面から「苦手マーク」を付けられます。
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** 直近7日間の回答数を集計 */
function getRecentDayStats(userData: UserData): { label: string; count: number }[] {
  const days: { label: string; count: number }[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const label = `${date.getMonth() + 1}/${date.getDate()}`

    const count = userData.questionHistory.filter((h) => {
      return h.answeredAt.startsWith(dateStr)
    }).length

    days.push({ label, count })
  }

  return days
}
