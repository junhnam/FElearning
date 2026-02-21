export default function Progress(): React.JSX.Element {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">学習進捗</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">学習進捗の詳細表示は Phase 3 で実装予定です</p>
        <p className="text-sm text-gray-400 mt-2">
          カテゴリ別正答率、学習履歴グラフなどが表示されます
        </p>
      </div>
    </div>
  )
}
