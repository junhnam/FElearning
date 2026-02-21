/**
 * IPC ハンドラー
 * メインプロセスとレンダラープロセス間の通信を管理する
 */
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AnswerRecord } from '../shared/types'
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
}
