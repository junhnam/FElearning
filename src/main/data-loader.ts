/**
 * データローダー
 * data/ ディレクトリからレジュメ・問題・メタデータの JSON を読み込む
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { ResumeSection, Question, CategoryDefinition } from '../shared/types'

// データキャッシュ
let resumeCache: ResumeSection[] | null = null
let questionCache: Question[] | null = null
let categoryCache: CategoryDefinition[] | null = null

/** data/ ディレクトリのパスを取得（開発/本番で異なる） */
function getDataPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data')
  }
  // 開発時: プロジェクトルートの data/ ディレクトリ
  return path.join(app.getAppPath(), 'data')
}

/** 指定ディレクトリ内の全 JSON ファイルを再帰的に読み込む */
function loadJsonFilesRecursive<T>(dirPath: string): T[] {
  const results: T[] = []

  if (!fs.existsSync(dirPath)) {
    console.warn(`ディレクトリが見つかりません: ${dirPath}`)
    return results
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      results.push(...loadJsonFilesRecursive<T>(fullPath))
    } else if (entry.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const parsed = JSON.parse(content)
        // 配列の場合は展開、オブジェクトの場合はそのまま追加
        if (Array.isArray(parsed)) {
          results.push(...parsed)
        } else {
          results.push(parsed)
        }
      } catch (e) {
        console.error(`JSON ファイルの読み込みに失敗: ${fullPath}`, e)
      }
    }
  }

  return results
}

/** 全レジュメセクションを読み込む */
export function loadAllResumeSections(): ResumeSection[] {
  if (resumeCache) return resumeCache
  const dataPath = getDataPath()
  const resumePath = path.join(dataPath, 'resume')
  resumeCache = loadJsonFilesRecursive<ResumeSection>(resumePath)
  return resumeCache
}

/** 指定 ID のレジュメセクションを取得 */
export function getResumeSectionById(sectionId: string): ResumeSection | null {
  const sections = loadAllResumeSections()
  return sections.find((s) => s.sectionId === sectionId) || null
}

/** 全問題を読み込む */
export function loadAllQuestions(): Question[] {
  if (questionCache) return questionCache
  const dataPath = getDataPath()
  const questionPath = path.join(dataPath, 'questions')
  questionCache = loadJsonFilesRecursive<Question>(questionPath)
  return questionCache
}

/** カテゴリとレベルで問題をフィルタリング */
export function loadQuestionsByFilter(params: {
  category?: string
  subcategory?: string
  level?: number
  examType?: string
}): Question[] {
  const allQuestions = loadAllQuestions()
  return allQuestions.filter((q) => {
    if (params.category && q.category !== params.category) return false
    if (params.subcategory && q.subcategory !== params.subcategory) return false
    if (params.level && q.level !== params.level) return false
    if (params.examType && q.examType !== params.examType) return false
    return true
  })
}

/** 指定 ID の問題を取得 */
export function getQuestionById(questionId: string): Question | null {
  const questions = loadAllQuestions()
  return questions.find((q) => q.questionId === questionId) || null
}

/** カテゴリ定義を読み込む */
export function loadCategories(): CategoryDefinition[] {
  if (categoryCache) return categoryCache
  const dataPath = getDataPath()
  const categoriesPath = path.join(dataPath, 'metadata', 'categories.json')
  try {
    if (fs.existsSync(categoriesPath)) {
      const content = fs.readFileSync(categoriesPath, 'utf-8')
      categoryCache = JSON.parse(content)
      return categoryCache!
    }
  } catch (e) {
    console.error('カテゴリ定義の読み込みに失敗:', e)
  }
  return []
}

/** キャッシュをクリア（データ再読み込み用） */
export function clearCache(): void {
  resumeCache = null
  questionCache = null
  categoryCache = null
}
