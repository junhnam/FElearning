/**
 * IPC ハンドラー
 * メインプロセスとレンダラープロセス間の通信を管理する
 */
import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import { IPC_CHANNELS } from '../shared/types'
import type { AnswerRecord, UserData } from '../shared/types'
import { JsonStore } from './store'
import * as dataLoader from './data-loader'
import { processAnswer, updateStreak } from './level-system'

export function registerIpcHandlers(store: JsonStore): void {
  // レジュメ一覧を取得
  ipcMain.handle(IPC_CHANNELS.GET_RESUME_LIST, () => {
    return dataLoader.loadAllResumeSections()
  })

  // 指定IDのレジュメセクションを取得
  ipcMain.handle(IPC_CHANNELS.GET_RESUME_SECTION, (_, sectionId: string) => {
    return dataLoader.getResumeSectionById(sectionId)
  })

  // 問題をフィルタリングして取得
  ipcMain.handle(
    IPC_CHANNELS.GET_QUESTIONS,
    (_, params: { category?: string; subcategory?: string; level?: number; examType?: string }) => {
      return dataLoader.loadQuestionsByFilter(params)
    }
  )

  // 指定IDの問題を取得
  ipcMain.handle(IPC_CHANNELS.GET_QUESTION_BY_ID, (_, questionId: string) => {
    return dataLoader.getQuestionById(questionId)
  })

  // ユーザーデータを取得
  ipcMain.handle(IPC_CHANNELS.GET_USER_DATA, () => {
    return store.getData()
  })

  // ユーザーデータを保存
  ipcMain.handle(IPC_CHANNELS.SAVE_USER_DATA, (_, data: Record<string, unknown>) => {
    store.updateData(data)
    return { success: true }
  })

  // 回答を記録し、レベル変動を処理する
  ipcMain.handle(IPC_CHANNELS.RECORD_ANSWER, (_, answer: AnswerRecord) => {
    const userData = store.getData()

    // 回答履歴に追加
    userData.questionHistory.push(answer)

    // レベル変動を処理
    const levelChange = processAnswer(userData, answer.subcategory, answer.isCorrect)

    // ストリークを更新
    updateStreak(userData)

    // 保存
    store.setData(userData)

    return {
      userData: store.getData(),
      levelChange
    }
  })

  // カテゴリ定義を取得
  ipcMain.handle(IPC_CHANNELS.GET_CATEGORIES, () => {
    return dataLoader.loadCategories()
  })

  // ブックマークの切り替え（問題 or レジュメ）
  ipcMain.handle(
    IPC_CHANNELS.TOGGLE_BOOKMARK,
    (_, payload: { type: 'questions' | 'resumeSections'; id: string }) => {
      const userData = store.getData()
      const list = userData.bookmarks[payload.type]
      const idx = list.indexOf(payload.id)
      if (idx === -1) {
        list.push(payload.id)
      } else {
        list.splice(idx, 1)
      }
      store.setData(userData)
      return { bookmarks: userData.bookmarks }
    }
  )

  // 苦手問題の切り替え
  ipcMain.handle(IPC_CHANNELS.TOGGLE_WEAK_QUESTION, (_, questionId: string) => {
    const userData = store.getData()
    const idx = userData.weakQuestions.indexOf(questionId)
    if (idx === -1) {
      userData.weakQuestions.push(questionId)
    } else {
      userData.weakQuestions.splice(idx, 1)
    }
    store.setData(userData)
    return { weakQuestions: userData.weakQuestions }
  })

  // データエクスポート
  ipcMain.handle(IPC_CHANNELS.EXPORT_USER_DATA, async () => {
    const result = await dialog.showSaveDialog({
      title: '学習データのエクスポート',
      defaultPath: `fe-master-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }
    const data = store.getData()
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, filePath: result.filePath }
  })

  // データインポート
  ipcMain.handle(IPC_CHANNELS.IMPORT_USER_DATA, async () => {
    const result = await dialog.showOpenDialog({
      title: '学習データのインポート',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8')
      const imported = JSON.parse(content) as UserData
      // 基本的なバリデーション
      if (!imported.userId || !imported.levels || !imported.questionHistory) {
        return { success: false, error: '不正なデータ形式です' }
      }
      store.setData(imported)
      return { success: true, userData: store.getData() }
    } catch {
      return { success: false, error: 'ファイルの読み込みに失敗しました' }
    }
  })

  // データリセット
  ipcMain.handle(IPC_CHANNELS.RESET_USER_DATA, () => {
    const freshData: UserData = {
      userId: 'local-user',
      createdAt: new Date().toISOString(),
      levels: { overall: 1, categories: {} },
      streaks: { currentStreak: 0, maxStreak: 0, lastStudyDate: '' },
      questionHistory: [],
      resumeProgress: {},
      bookmarks: { questions: [], resumeSections: [] },
      weakQuestions: [],
      consecutiveCorrect: {},
      consecutiveWrong: {},
      settings: { theme: 'light', fontSize: 'medium', examMode: 'all', selectedCategories: [] }
    }
    store.setData(freshData)
    return { success: true, userData: freshData }
  })
}
