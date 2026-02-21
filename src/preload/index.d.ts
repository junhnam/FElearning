import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ResumeSection,
  Question,
  UserData,
  CategoryDefinition,
  LevelChangeResult
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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FEMasterAPI
  }
}
