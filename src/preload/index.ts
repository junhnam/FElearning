import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/types'

// レンダラープロセスに公開するAPI
const api = {
  // レジュメ
  getResumeList: () => ipcRenderer.invoke(IPC_CHANNELS.GET_RESUME_LIST),
  getResumeSection: (sectionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_RESUME_SECTION, sectionId),

  // 問題
  getQuestions: (params: { category?: string; subcategory?: string; level?: number; examType?: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_QUESTIONS, params),
  getQuestionById: (questionId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_QUESTION_BY_ID, questionId),

  // ユーザーデータ
  getUserData: () => ipcRenderer.invoke(IPC_CHANNELS.GET_USER_DATA),
  saveUserData: (data: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_USER_DATA, data),
  recordAnswer: (answer: {
    questionId: string
    answeredAt: string
    selectedChoice: string
    isCorrect: boolean
    timeSpent: number
    category: string
    subcategory: string
  }) => ipcRenderer.invoke(IPC_CHANNELS.RECORD_ANSWER, answer),

  // メタデータ
  getCategories: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CATEGORIES)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
