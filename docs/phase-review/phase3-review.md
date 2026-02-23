# Phase 3 レビュー記録

## レビュー日: 2026-02-23

## 実装完了項目

### 設定画面 (Settings.tsx)
- [x] テーマ切替（ライト/ダーク）
- [x] フォントサイズ変更（小/中/大）
- [x] 出題モード選択（全範囲/科目A/科目B）
- [x] カテゴリ別レベル手動調整（スライダーUI、グループ分け表示）
- [x] データエクスポート（JSONファイル保存、ファイルダイアログ付き）
- [x] データインポート（JSONファイル読み込み、バリデーション付き）
- [x] データリセット（確認ダイアログ付き）
- [x] アプリ情報表示

### ブックマーク機能 (Bookmarks.tsx)
- [x] 問題ブックマーク一覧表示
- [x] レジュメブックマーク一覧表示
- [x] タブ切り替えUI
- [x] ブックマーク解除ボタン
- [x] ブックマークした問題への直接リンク
- [x] Practice.tsx に★ブックマークボタン追加

### 苦手問題管理 + 間隔反復学習 (question-selector.ts)
- [x] 苦手マークトグル機能（Practice.tsx + IPC）
- [x] 間隔反復アルゴリズム:
  - 1回間違い → 3問後に再出題
  - 2回間違い → 10問後に再出題
  - 3回以上 → 5問後に再出題
- [x] 苦手問題の優先出題（20%の確率）
- [x] 正解時のリセット処理

### ダッシュボード (Dashboard.tsx)
- [x] 統計サマリー（総合レベル・回答数・正答率・連続学習日数）
- [x] Recharts RadarChart による科目Aカテゴリ別レベル表示
- [x] SVG円グラフによる推定合格率表示（10問以上で表示）
- [x] 苦手カテゴリ一覧（正答率バー付き）
- [x] 学習アドバイス（動的生成）
- [x] クイックアクションリンク（問題・レジュメ・模擬試験・進捗）

### 学習進捗 (Progress.tsx)
- [x] 全体サマリー（回答数・正解数・正答率・連続学習・最長連続）
- [x] PieChart（正解/不正解の円グラフ）
- [x] BarChart（直近7日間の回答数推移）
- [x] 科目A カテゴリ別正答率（バーチャート + レベル・回答数表示）
- [x] 科目B カテゴリ別正答率
- [x] 苦手問題セクション

### 模擬試験モード (MockExam.tsx)
- [x] 4種類の試験形式:
  - 科目A 本番形式（60問/90分）
  - 科目B 本番形式（20問/100分）
  - 科目A ミニ模試（20問/30分）
  - 科目B ミニ模試（5問/25分）
- [x] カウントダウンタイマー（残り5分で赤表示）
- [x] 問題番号ナビゲーショングリッド
- [x] フラグ機能（あとで見返す問題をマーク）
- [x] 終了確認ダイアログ（未回答数表示）
- [x] 結果画面（スコア・合否判定・カテゴリ別結果・問題一覧）
- [x] 回答の自動記録（既存のrecordAnswer APIを活用）
- [x] サイドバーにナビゲーション項目追加

### ダークモード (main.css)
- [x] CSS変数ベースのダークモード
- [x] html.dark クラスによる切り替え
- [x] 全画面のダーク対応:
  - 背景色（ページ・カード・サイドバー）
  - テキスト色（各階層）
  - ボーダー色
  - 正解/不正解の色調整
  - ホバーエフェクト
  - スクロールバー
  - フォーム要素（select, input）
- [x] App.tsx でテーマ設定の自動適用（2秒ポーリング）
- [x] フォントサイズ設定の自動適用

### IPC ハンドラー追加 (ipc-handlers.ts)
- [x] toggleBookmark: ブックマーク切り替え
- [x] toggleWeakQuestion: 苦手問題切り替え
- [x] exportUserData: ファイルダイアログ + JSON書き出し
- [x] importUserData: ファイル読み込み + バリデーション + データ復元
- [x] resetUserData: 学習データ初期化

## 技術的な変更点

| 項目 | 内容 |
|------|------|
| 新規依存 | recharts v3.7.0 |
| 新規ページ | MockExam.tsx |
| 新規ルート | /mock-exam |
| 型追加 | MockExamType, MockExamConfig, MockExamSession |
| IPC追加 | 5チャンネル |
| CSS追加 | ダークモード（約150行） |

## ファイル変更サマリー

| ファイル | 変更内容 |
|---------|----------|
| package.json | recharts 追加 |
| src/shared/types.ts | 模擬試験型・IPC定数追加 |
| src/main/ipc-handlers.ts | 5 IPC ハンドラー追加 |
| src/preload/index.ts | 5 API メソッド追加 |
| src/preload/index.d.ts | 型定義追加 |
| src/renderer/src/App.tsx | テーマ適用ロジック・MockExamルート追加 |
| src/renderer/src/assets/main.css | ダークモードCSS追加 |
| src/renderer/src/components/Sidebar.tsx | 模擬試験ナビ項目・ExamIcon追加 |
| src/renderer/src/pages/Dashboard.tsx | 全面リライト（Recharts対応） |
| src/renderer/src/pages/Progress.tsx | 全面リライト（チャート対応） |
| src/renderer/src/pages/Settings.tsx | 全面リライト（全機能実装） |
| src/renderer/src/pages/Bookmarks.tsx | 全面リライト（全機能実装） |
| src/renderer/src/pages/Practice.tsx | ブックマーク・苦手ボタン追加 |
| src/renderer/src/pages/MockExam.tsx | 新規作成 |
| src/renderer/src/utils/question-selector.ts | 間隔反復・苦手問題ロジック追加 |

## ビルド結果

```
✓ main:     out/main/index.js      17.77 kB
✓ preload:  out/preload/index.js    2.38 kB
✓ renderer: out/renderer/
  - index.html              0.54 kB
  - assets/index.css       32.34 kB
  - assets/index.js     1,643.43 kB
```

TypeScript 型チェック: エラーなし
