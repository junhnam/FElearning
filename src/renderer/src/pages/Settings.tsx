import { useState, useEffect } from 'react'
import type { UserData, CategoryDefinition } from '@shared/types'

export default function Settings(): React.JSX.Element {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    Promise.all([window.api.getUserData(), window.api.getCategories()])
      .then(([data, cats]) => {
        setUserData(data)
        setCategories(cats)
      })
      .catch(console.error)
  }, [])

  const showMsg = (type: 'success' | 'error', text: string): void => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveSettings = async (newSettings: Partial<UserData['settings']>): Promise<void> => {
    if (!userData) return
    setSaving(true)
    const updated = { ...userData.settings, ...newSettings }
    await window.api.saveUserData({ settings: updated })
    setUserData({ ...userData, settings: updated })
    setSaving(false)
    showMsg('success', '設定を保存しました')
  }

  const handleLevelChange = async (catId: string, level: number): Promise<void> => {
    if (!userData) return
    const newCategories = { ...userData.levels.categories, [catId]: level }
    await window.api.saveUserData({ levels: { ...userData.levels, categories: newCategories } })
    const refreshed = await window.api.getUserData()
    setUserData(refreshed)
  }

  const handleExport = async (): Promise<void> => {
    const result = await window.api.exportUserData()
    if (result.success) {
      showMsg('success', 'データをエクスポートしました')
    }
  }

  const handleImport = async (): Promise<void> => {
    const result = await window.api.importUserData()
    if (result.success && result.userData) {
      setUserData(result.userData)
      showMsg('success', 'データをインポートしました')
    } else if (result.error) {
      showMsg('error', result.error)
    }
  }

  const handleReset = async (): Promise<void> => {
    const result = await window.api.resetUserData()
    if (result.success) {
      setUserData(result.userData)
      setShowResetConfirm(false)
      showMsg('success', '学習データをリセットしました')
    }
  }

  if (!userData) return <div className="max-w-4xl mx-auto"><p className="text-gray-500">読み込み中...</p></div>

  // カテゴリをグループ分け
  const catGroups: Record<string, CategoryDefinition[]> = {}
  for (const cat of categories) {
    const parent = cat.parent || cat.examType
    if (!catGroups[parent]) catGroups[parent] = []
    catGroups[parent].push(cat)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">設定</h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-correct-light text-correct-dark' : 'bg-incorrect-light text-incorrect-dark'
        }`}>
          {message.text}
        </div>
      )}

      {/* 表示設定 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">表示設定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">テーマ</p>
              <p className="text-sm text-gray-500">ライトモード / ダークモード</p>
            </div>
            <select
              value={userData.settings.theme}
              onChange={(e) => saveSettings({ theme: e.target.value as 'light' | 'dark' })}
              disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="light">ライトモード</option>
              <option value="dark">ダークモード</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">フォントサイズ</p>
              <p className="text-sm text-gray-500">文字の大きさを変更</p>
            </div>
            <select
              value={userData.settings.fontSize}
              onChange={(e) => saveSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
              disabled={saving}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>
        </div>
      </section>

      {/* 出題設定 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">出題設定</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700">出題モード</p>
            <p className="text-sm text-gray-500">練習問題の出題範囲</p>
          </div>
          <select
            value={userData.settings.examMode}
            onChange={(e) => saveSettings({ examMode: e.target.value as 'all' | '科目A' | '科目B' })}
            disabled={saving}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">全範囲</option>
            <option value="科目A">科目A のみ</option>
            <option value="科目B">科目B のみ</option>
          </select>
        </div>
      </section>

      {/* レベル手動調整 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">カテゴリ別レベル調整</h3>
        <p className="text-sm text-gray-500 mb-4">各カテゴリのレベルを手動で変更できます（即時反映）</p>
        <div className="space-y-6">
          {Object.entries(catGroups).map(([parent, cats]) => (
            <div key={parent}>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">{parent}</h4>
              <div className="space-y-2">
                {cats.map((cat) => {
                  const level = userData.levels.categories[cat.id] ?? 1
                  return (
                    <div key={cat.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-48 truncate">{cat.name}</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={level}
                        onChange={(e) => handleLevelChange(cat.id, Number(e.target.value))}
                        className="flex-1 accent-primary-600"
                      />
                      <span className="text-sm font-semibold text-primary-600 w-12 text-right">Lv.{level}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* データ管理 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">データ管理</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">データエクスポート</p>
              <p className="text-sm text-gray-500">学習データをJSONファイルとして保存</p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              エクスポート
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">データインポート</p>
              <p className="text-sm text-gray-500">バックアップファイルから学習データを復元</p>
            </div>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              インポート
            </button>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">データリセット</p>
                <p className="text-sm text-gray-500">すべての学習データを初期化します</p>
              </div>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  リセット
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    本当にリセットする
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* アプリ情報 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">アプリ情報</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>FE Master v1.0</p>
          <p>基本情報技術者試験 対策アプリ</p>
          <p>問題数: 1000問（科目A 700問 + 科目B 300問）</p>
        </div>
      </section>
    </div>
  )
}
