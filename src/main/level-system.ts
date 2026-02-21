/**
 * レベルシステム
 * 要件定義書セクション 5.4 に準拠した適応型難易度調整ロジック
 */
import type { UserData, LevelChangeResult, CategoryDefinition } from '../shared/types'

const MIN_LEVEL = 1
const MAX_LEVEL = 10
const STREAK_THRESHOLD = 3 // 連続正解/不正解のしきい値

// カテゴリ大分類ごとの重み（総合レベル算出用）
const PARENT_WEIGHTS: Record<string, number> = {
  'テクノロジ系': 0.55,
  'マネジメント系': 0.20,
  'ストラテジ系': 0.25
}

/**
 * 回答を処理し、レベル変動を判定する
 * - 同一カテゴリ3問連続正解 → レベル+1（最大10）
 * - 同一カテゴリ3問連続不正解 → レベル-1（最小1）
 * - レベル変動時・連続途切れ時にカウンタリセット
 */
export function processAnswer(
  userData: UserData,
  subcategory: string,
  isCorrect: boolean
): LevelChangeResult {
  const currentLevel = userData.levels.categories[subcategory] ?? 1

  const result: LevelChangeResult = {
    changed: false,
    previousLevel: currentLevel,
    newLevel: currentLevel,
    subcategory,
    direction: 'none'
  }

  if (isCorrect) {
    // 正解: 不正解カウンタをリセット、正解カウンタを加算
    userData.consecutiveWrong[subcategory] = 0
    userData.consecutiveCorrect[subcategory] =
      (userData.consecutiveCorrect[subcategory] ?? 0) + 1

    if (userData.consecutiveCorrect[subcategory] >= STREAK_THRESHOLD) {
      // レベルアップ判定
      const newLevel = Math.min(currentLevel + 1, MAX_LEVEL)
      if (newLevel !== currentLevel) {
        userData.levels.categories[subcategory] = newLevel
        result.changed = true
        result.newLevel = newLevel
        result.direction = 'up'
      }
      // カウンタリセット（レベル変動の有無にかかわらず）
      userData.consecutiveCorrect[subcategory] = 0
    }
  } else {
    // 不正解: 正解カウンタをリセット、不正解カウンタを加算
    userData.consecutiveCorrect[subcategory] = 0
    userData.consecutiveWrong[subcategory] =
      (userData.consecutiveWrong[subcategory] ?? 0) + 1

    if (userData.consecutiveWrong[subcategory] >= STREAK_THRESHOLD) {
      // レベルダウン判定
      const newLevel = Math.max(currentLevel - 1, MIN_LEVEL)
      if (newLevel !== currentLevel) {
        userData.levels.categories[subcategory] = newLevel
        result.changed = true
        result.newLevel = newLevel
        result.direction = 'down'
      }
      // カウンタリセット
      userData.consecutiveWrong[subcategory] = 0
    }
  }

  // 総合レベルを再計算
  userData.levels.overall = calculateOverallLevel(userData.levels.categories)

  return result
}

/**
 * 総合レベルを計算する
 * 各カテゴリレベルの「試験配点比例の加重平均」で算出
 */
function calculateOverallLevel(categories: Record<string, number>): number {
  if (Object.keys(categories).length === 0) return 1

  // カテゴリ → 大分類のマッピング（既知のカテゴリ）
  const categoryToParent: Record<string, string> = {
    'basic-theory': 'テクノロジ系',
    'algorithm-programming': 'テクノロジ系',
    'computer-components': 'テクノロジ系',
    'system-components': 'テクノロジ系',
    'software-hardware': 'テクノロジ系',
    'human-interface-multimedia': 'テクノロジ系',
    'database': 'テクノロジ系',
    'network': 'テクノロジ系',
    'security': 'テクノロジ系',
    'development': 'マネジメント系',
    'project-management': 'マネジメント系',
    'service-management': 'マネジメント系',
    'system-strategy': 'ストラテジ系',
    'business-strategy': 'ストラテジ系',
    'corporate-law': 'ストラテジ系'
  }

  // 大分類ごとの平均を算出
  const parentSums: Record<string, { total: number; count: number }> = {}

  for (const [catId, level] of Object.entries(categories)) {
    const parent = categoryToParent[catId]
    if (!parent) continue

    if (!parentSums[parent]) {
      parentSums[parent] = { total: 0, count: 0 }
    }
    parentSums[parent].total += level
    parentSums[parent].count += 1
  }

  // 加重平均を計算
  let weightedSum = 0
  let totalWeight = 0

  for (const [parent, { total, count }] of Object.entries(parentSums)) {
    const avg = total / count
    const weight = PARENT_WEIGHTS[parent] ?? 0
    weightedSum += avg * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 1

  return Math.round(weightedSum / totalWeight)
}

/**
 * ストリーク（連続学習日数）を更新する
 */
export function updateStreak(userData: UserData): void {
  const today = new Date().toISOString().split('T')[0]
  const lastDate = userData.streaks.lastStudyDate

  if (lastDate === today) {
    // 同日: 何もしない
    return
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastDate === yesterdayStr) {
    // 昨日の続き: ストリーク+1
    userData.streaks.currentStreak += 1
  } else {
    // 間が空いた: リセット
    userData.streaks.currentStreak = 1
  }

  userData.streaks.lastStudyDate = today
  if (userData.streaks.currentStreak > userData.streaks.maxStreak) {
    userData.streaks.maxStreak = userData.streaks.currentStreak
  }
}
