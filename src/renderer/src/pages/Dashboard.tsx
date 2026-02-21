import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { UserData } from '@shared/types'

export default function Dashboard(): React.JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    window.api.getUserData().then(setUserData).catch(console.error)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h2>

      {/* 総合レベルカード */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">
              {userData?.levels.overall ?? 1}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">総合レベル</h3>
            <p className="text-sm text-gray-500">
              問題を解いてレベルを上げましょう
            </p>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/resume"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">レジュメを読む</h3>
          <p className="text-sm text-gray-500">
            まずはレジュメで基礎知識を確認しましょう
          </p>
        </Link>
        <Link
          to="/practice"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">問題を解く</h3>
          <p className="text-sm text-gray-500">
            練習問題であなたのレベルに合った問題に挑戦しましょう
          </p>
        </Link>
      </div>

      {/* 学習統計（簡易版） */}
      {userData && userData.questionHistory.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">学習統計</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {userData.questionHistory.length}
              </p>
              <p className="text-sm text-gray-500">回答数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-correct">
                {Math.round(
                  (userData.questionHistory.filter((h) => h.isCorrect).length /
                    userData.questionHistory.length) *
                    100
                )}%
              </p>
              <p className="text-sm text-gray-500">正答率</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {userData.streaks.currentStreak}
              </p>
              <p className="text-sm text-gray-500">連続学習日数</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
