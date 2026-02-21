/**
 * 問題選択ロジック
 * 要件定義書セクション 5.4 の出題ロジックに基づく
 */
import type { Question, UserData } from '@shared/types'

/**
 * ユーザーのレベルに基づいて次の問題を選択する
 * - 現在のレベルの問題: 70%
 * - 現在のレベル ±1 の問題: 30%
 * - 未回答の問題を優先
 */
export function selectNextQuestion(
  allQuestions: Question[],
  userData: UserData,
  subcategory?: string
): Question | null {
  if (allQuestions.length === 0) return null

  // 回答済みの問題IDセット
  const answeredIds = new Set(userData.questionHistory.map((h) => h.questionId))

  // サブカテゴリが指定されている場合はフィルタリング
  let candidates = subcategory
    ? allQuestions.filter((q) => q.subcategory === subcategory)
    : allQuestions

  if (candidates.length === 0) return null

  // ユーザーのレベルを取得（サブカテゴリ別、なければデフォルト1）
  const getLevel = (q: Question): number => {
    return userData.levels.categories[q.subcategory] ?? 1
  }

  // 未回答の問題を優先
  const unanswered = candidates.filter((q) => !answeredIds.has(q.questionId))
  const pool = unanswered.length > 0 ? unanswered : candidates

  // レベルベースのフィルタリング
  const levelFiltered: Question[] = []
  for (const q of pool) {
    const userLevel = getLevel(q)
    if (q.level === userLevel) {
      // 同レベル: 70%の確率で選択（複数候補に追加）
      levelFiltered.push(q, q) // 重み付け: 2倍
    } else if (Math.abs(q.level - userLevel) === 1) {
      // ±1レベル: 30%
      levelFiltered.push(q)
    }
  }

  // レベルフィルタで候補がなければプール全体から選択
  const finalPool = levelFiltered.length > 0 ? levelFiltered : pool

  // ランダム選択
  const index = Math.floor(Math.random() * finalPool.length)
  return finalPool[index]
}
