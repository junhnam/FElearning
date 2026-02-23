import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ResumeSection,
  Question,
  UserData,
  CategoryDefinition,
  LevelChangeResult,
  BookmarkData
} from '../shared/types'

export interface FEMasterAPI {
  // レジュメ
  getResumeList: () => Promise<ResumeSection[]>
  getResumeSection: (sectionId: string) => Promise<ResumeSection | null>

  // 問題
  getQuestions: (params: {
    category?: string
    subcategory?: string
    level?: number
    examType?: string
  }) => Promise<Question[]>
  getQuestionById: (questionId: string) => Promise<Question | null>

  // ユーザーデータ
  getUserData: () => Promise<UserData>
  saveUserData: (data: Record<string, unknown>) => Promise<{ success: boolean }>
  recordAnswer: (answer: {
    questionId: string
    answeredAt: string
    selectedChoice: string
    isCorrect: boolean
    timeSpent: number
    category: string
    subcategory: string
  }) => Promise<{ userData: UserData; levelChange: LevelChangeResult }>

  // メタデータ
  getCategories: () => Promise<CategoryDefinition[]>

  // Phase 3: ブックマーク
  toggleBookmark: (payload: {
    type: 'questions' | 'resumeSections'
    id: string
  }) => Promise<{ bookmarks: BookmarkData }>

  // Phase 3: 苦手問題
  toggleWeakQuestion: (questionId: string) => Promise<{ weakQuestions: string[] }>

  // Phase 3: データ管理
  exportUserData: () => Promise<{ success: boolean; filePath?: string }>
  importUserData: () => Promise<{ success: boolean; userData?: UserData; error?: string }>
  resetUserData: () => Promise<{ success: boolean; userData: UserData }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FEMasterAPI
  }
}
