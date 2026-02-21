/**
 * カスタム JSON ストア
 * ユーザーの学習データをローカルファイルに永続化する
 */
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { UserData } from '../shared/types'

const USER_DATA_FILE = 'user-data.json'
const BACKUP_DIR = 'backups'
const MAX_BACKUPS = 3

export class JsonStore {
  private filePath: string
  private backupDir: string
  private data: UserData

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, USER_DATA_FILE)
    this.backupDir = path.join(userDataPath, BACKUP_DIR)
    this.data = this.load()
  }

  /** デフォルトのユーザーデータを生成 */
  private createDefaultUserData(): UserData {
    return {
      userId: 'local-user',
      createdAt: new Date().toISOString(),
      levels: {
        overall: 1,
        categories: {}
      },
      streaks: {
        currentStreak: 0,
        maxStreak: 0,
        lastStudyDate: ''
      },
      questionHistory: [],
      resumeProgress: {},
      bookmarks: {
        questions: [],
        resumeSections: []
      },
      weakQuestions: [],
      consecutiveCorrect: {},
      consecutiveWrong: {},
      settings: {
        theme: 'light',
        fontSize: 'medium',
        examMode: 'all',
        selectedCategories: []
      }
    }
  }

  /** データファイルを読み込む（破損時はバックアップにフォールバック） */
  private load(): UserData {
    // メインファイルの読み込みを試行
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(content) as UserData
      }
    } catch (e) {
      console.error('ユーザーデータの読み込みに失敗しました。バックアップを試行します:', e)
    }

    // バックアップからの復元を試行
    try {
      if (fs.existsSync(this.backupDir)) {
        const backups = fs.readdirSync(this.backupDir)
          .filter((f) => f.endsWith('.json'))
          .sort()
          .reverse()

        for (const backup of backups) {
          try {
            const content = fs.readFileSync(path.join(this.backupDir, backup), 'utf-8')
            const data = JSON.parse(content) as UserData
            console.log(`バックアップから復元しました: ${backup}`)
            return data
          } catch {
            continue
          }
        }
      }
    } catch (e) {
      console.error('バックアップの読み込みにも失敗しました:', e)
    }

    // 全て失敗した場合は新規作成
    console.log('新規ユーザーデータを作成します')
    return this.createDefaultUserData()
  }

  /** データを保存（バックアップ付き） */
  save(): void {
    try {
      // バックアップディレクトリの作成
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true })
      }

      // 既存ファイルがあればバックアップ
      if (fs.existsSync(this.filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.join(this.backupDir, `user-data-${timestamp}.json`)
        fs.copyFileSync(this.filePath, backupPath)

        // 古いバックアップを削除（MAX_BACKUPS 世代まで保持）
        const backups = fs.readdirSync(this.backupDir)
          .filter((f) => f.endsWith('.json'))
          .sort()
        while (backups.length > MAX_BACKUPS) {
          const oldest = backups.shift()!
          fs.unlinkSync(path.join(this.backupDir, oldest))
        }
      }

      // データディレクトリの確認
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // 一時ファイルに書いてからリネーム（アトミック書き込み）
      const tmpPath = this.filePath + '.tmp'
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8')
      fs.renameSync(tmpPath, this.filePath)
    } catch (e) {
      console.error('データの保存に失敗しました:', e)
    }
  }

  /** 全データを取得 */
  getData(): UserData {
    return this.data
  }

  /** データを部分更新して保存 */
  updateData(partial: Partial<UserData>): void {
    this.data = { ...this.data, ...partial }
    this.save()
  }

  /** データ全体を置き換えて保存 */
  setData(data: UserData): void {
    this.data = data
    this.save()
  }
}
