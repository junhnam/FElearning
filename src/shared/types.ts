// ========================================
// レジュメ関連の型定義
// ========================================

export interface ResumeSection {
  sectionId: string
  category: string // "テクノロジ系" | "マネジメント系" | "ストラテジ系"
  chapter: string
  title: string
  overview: {
    analogy: string
    summary: string
  }
  content: ResumeContent[]
  keyTerms: KeyTerm[]
  relatedQuestions: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface ResumeContent {
  heading: string
  body: string
  diagram: string | null
}

export interface KeyTerm {
  term: string
  definition: string
  analogy: string
}

// ========================================
// 問題関連の型定義
// ========================================

export interface Question {
  questionId: string
  examType: '科目A' | '科目B'
  category: string
  subcategory: string
  topic: string
  level: number // 1-10
  question: string
  choices: Choice[]
  overallExplanation: OverallExplanation
  tags: string[]
  // 科目B 専用フィールド
  pseudoCode?: string
  traceTable?: TraceStep[]
  traceAnalogy?: string
}

export interface Choice {
  id: string // "a" | "b" | "c" | "d"
  text: string
  isCorrect: boolean
  explanation: CorrectExplanation | WrongExplanation
}

export interface CorrectExplanation {
  whyCorrect: string
  analogy: string
  deepDive: string
}

export interface WrongExplanation {
  whyWrong: string
  analogy: string
}

export interface OverallExplanation {
  summary: string
  keyPoint: string
  relatedTopics: string[]
  studyTip: string
}

export interface TraceStep {
  step: number
  [key: string]: unknown
  action: string
}

// ========================================
// ユーザーデータの型定義
// ========================================

export interface UserData {
  userId: string
  createdAt: string
  levels: LevelData
  streaks: StreakData
  questionHistory: AnswerRecord[]
  resumeProgress: Record<string, ResumeProgressEntry>
  bookmarks: BookmarkData
  weakQuestions: string[]
  consecutiveCorrect: Record<string, number>
  consecutiveWrong: Record<string, number>
  settings: UserSettings
}

export interface LevelData {
  overall: number
  categories: Record<string, number>
}

export interface StreakData {
  currentStreak: number
  maxStreak: number
  lastStudyDate: string
}

export interface AnswerRecord {
  questionId: string
  answeredAt: string
  selectedChoice: string
  isCorrect: boolean
  timeSpent: number
  category: string
  subcategory: string
}

export interface ResumeProgressEntry {
  status: 'unread' | 'read'
  readAt: string | null
}

export interface BookmarkData {
  questions: string[]
  resumeSections: string[]
}

export interface UserSettings {
  theme: 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  examMode: 'all' | '科目A' | '科目B'
  selectedCategories: string[]
}

// ========================================
// カテゴリメタデータ
// ========================================

export interface CategoryDefinition {
  id: string
  name: string
  examType: '科目A' | '科目B'
  parent: string // "テクノロジ系" | "マネジメント系" | "ストラテジ系"
  weight: number
}

// ========================================
// レベル変動結果
// ========================================

export interface LevelChangeResult {
  changed: boolean
  previousLevel: number
  newLevel: number
  subcategory: string
  direction: 'up' | 'down' | 'none'
}

// ========================================
// IPC チャンネル名の定数
// ========================================

export const IPC_CHANNELS = {
  GET_RESUME_LIST: 'get-resume-list',
  GET_RESUME_SECTION: 'get-resume-section',
  GET_QUESTIONS: 'get-questions',
  GET_QUESTION_BY_ID: 'get-question-by-id',
  GET_USER_DATA: 'get-user-data',
  SAVE_USER_DATA: 'save-user-data',
  RECORD_ANSWER: 'record-answer',
  GET_CATEGORIES: 'get-categories'
} as const
