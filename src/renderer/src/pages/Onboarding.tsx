import { useState } from 'react'

interface OnboardingProps {
  onComplete: (initialLevel: number) => void
}

export default function Onboarding({ onComplete }: OnboardingProps): React.JSX.Element {
  const [step, setStep] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  // ステップ 0: ウェルカム
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-6">
        <div className="max-w-lg text-center animate-fadeIn">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-3xl font-bold text-primary-800 mb-4">
            FE Master へようこそ！
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            基本情報技術者試験の合格を一緒に目指しましょう。<br />
            すべての解説は「たとえ話」で分かりやすく説明します。
          </p>
          <button
            onClick={() => setStep(1)}
            className="px-8 py-3 bg-primary-600 text-white rounded-xl font-medium text-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            はじめる
          </button>
        </div>
      </div>
    )
  }

  // ステップ 1: 学習経験の確認
  if (step === 1) {
    const options = [
      { level: 1, label: '全くの初心者', desc: 'IT知識はほとんどありません', icon: '🌱' },
      { level: 3, label: '少し勉強したことがある', desc: '基本的なIT用語は知っています', icon: '📗' },
      { level: 5, label: 'かなり勉強している', desc: '過去問も何回か解いたことがあります', icon: '📘' }
    ]

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-6">
        <div className="max-w-lg text-center animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            基本情報技術者試験の学習経験はありますか？
          </h2>
          <p className="text-gray-500 mb-8">あなたのレベルに合わせて問題を調整します</p>
          <div className="space-y-4">
            {options.map((opt) => (
              <button
                key={opt.level}
                onClick={() => setSelectedLevel(opt.level)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                  selectedLevel === opt.level
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => selectedLevel !== null && setStep(2)}
            disabled={selectedLevel === null}
            className="mt-8 px-8 py-3 bg-primary-600 text-white rounded-xl font-medium text-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            次へ
          </button>
        </div>
      </div>
    )
  }

  // ステップ 2: 学習モード選択
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-6">
      <div className="max-w-lg text-center animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">まずは何から始めますか？</h2>
        <p className="text-gray-500 mb-8">いつでも変更できるので気軽に選んでください</p>
        <div className="space-y-4">
          <button
            onClick={() => onComplete(selectedLevel!)}
            className="w-full text-left p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📖</span>
              <div>
                <p className="font-semibold text-gray-800">レジュメを読んで基礎固め</p>
                <p className="text-sm text-gray-500">まずは知識の整理から始めましょう</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => onComplete(selectedLevel!)}
            className="w-full text-left p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div>
                <p className="font-semibold text-gray-800">いきなり問題に挑戦</p>
                <p className="text-sm text-gray-500">実力を試しながら学習しましょう</p>
              </div>
            </div>
          </button>
        </div>
        <button
          onClick={() => setStep(1)}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          ← 戻る
        </button>
      </div>
    </div>
  )
}
