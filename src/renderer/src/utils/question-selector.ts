/**
 * 問題選択ロジック
 * 要件定義書セクション 5.4 の出題ロジックに基づく
 * Phase 3: 間隔反復学習・苦手問題対応を追加
 */
import type { Question, UserData } from '@shared/types'

/**
 * ユーザーのレベルに基づいて次の問題を選択する
 * - 現在のレベルの問題: 70%
 * - 現在のレベル ±1 の問題: 30%
 * - 未回答の問題を優先
 * - 間隔反復: 間違えた問題を一定間隔で再出題
 * - 苦手問題を重点的に再出題
 */
export function selectNextQuestion(
  allQuestions: Question[],
  userData: UserData,
  subcategory?: string
): Question | null {
  if (allQuestions.length === 0) return null

  // 出題モードによるフィルタリング
  let candidates = allQuestions
  if (userData.settings.examMode === '科目A') {
    candidates = candidates.filter((q) => q.examType === '科目A')
  } else if (userData.settings.examMode === '科目B') {
    candidates = candidates.filter((q) => q.examType === '科目B')
  }

  // サブカテゴリが指定されている場合はフィルタリング
  if (subcategory) {
    candidates = candidates.filter((q) => q.subcategory === subcategory)
  }

  if (candidates.length === 0) return null

  // 回答履歴から情報を収集
  const answeredIds = new Set(userData.questionHistory.map((h) => h.questionId))
  const totalAnswered = userData.questionHistory.length

  // 間隔反復: 再出題が必要な問題を特定
  const retryQuestion = getSpacedRepetitionQuestion(candidates, userData, totalAnswered)
  if (retryQuestion) return retryQuestion

  // 苦手問題の重点出題（20%の確率で苦手問題を出す）
  if (Math.random() < 0.2 && userData.weakQuestions.length > 0) {
    const weakCandidates = candidates.filter((q) => userData.weakQuestions.includes(q.questionId))
    if (weakCandidates.length > 0) {
      return weakCandidates[Math.floor(Math.random() * weakCandidates.length)]
    }
  }

  // 未回答の問題を優先
  const unanswered = candidates.filter((q) => !answeredIds.has(q.questionId))
  const pool = unanswered.length > 0 ? unanswered : candidates

  // レベルベースのフィルタリング
  const levelFiltered: Question[] = []
  for (const q of pool) {
    const userLevel = userData.levels.categories[q.subcategory] ?? 1
    if (q.level === userLevel) {
      levelFiltered.push(q, q) // 重み付け: 2倍
    } else if (Math.abs(q.level - userLevel) === 1) {
      levelFiltered.push(q)
    }
  }

  // レベルフィルタで候補がなければプール全体から選択
  const finalPool = levelFiltered.length > 0 ? levelFiltered : pool

  // ランダム選択
  const index = Math.floor(Math.random() * finalPool.length)
  return finalPool[index]
}

/**
 * 間隔反復学習: 間違えた問題を一定間隔で再出題
 * - 1回間違い: 3問後に再出題
 * - 2回間違い: 10問後に再出題
 * - 3回以上間違い: 苦手問題としてマーク済み、重点的に再出題
 */
function getSpacedRepetitionQuestion(
  candidates: Question[],
  userData: UserData,
  totalAnswered: number
): Question | null {
  // 間違えた問題とその最後の回答位置を取得
  const wrongQuestions = new Map<string, { wrongCount: number; lastAnsweredAt: number }>()

  for (let i = 0; i < userData.questionHistory.length; i++) {
    const record = userData.questionHistory[i]
    if (!record.isCorrect) {
      const existing = wrongQuestions.get(record.questionId)
      wrongQuestions.set(record.questionId, {
        wrongCount: (existing?.wrongCount ?? 0) + 1,
        lastAnsweredAt: i
      })
    } else {
      // 正解したらリセット（直近で正解した問題は再出題不要）
      wrongQuestions.delete(record.questionId)
    }
  }

  // 再出題が必要な問題をチェック
  const candidateIds = new Set(candidates.map((q) => q.questionId))
  for (const [qId, info] of wrongQuestions) {
    if (!candidateIds.has(qId)) continue

    const questionsSince = totalAnswered - info.lastAnsweredAt - 1
    let retryInterval: number

    if (info.wrongCount >= 3) {
      retryInterval = 5 // 3回以上: 5問後
    } else if (info.wrongCount === 2) {
      retryInterval = 10 // 2回: 10問後
    } else {
      retryInterval = 3 // 1回: 3問後
    }

    if (questionsSince >= retryInterval) {
      const question = candidates.find((q) => q.questionId === qId)
      if (question) return question
    }
  }

  return null
}
