import { useState, useEffect } from 'react'

/**
 * IPC APIの呼び出しを抽象化するフック
 * ローディング状態とエラーハンドリングを提供する
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = (): void => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'データの読み込みに失敗しました')
          setLoading(false)
        }
      })
    // cleanup用のフラグ制御は useEffect の return で行う
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'データの読み込みに失敗しました')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error, refetch: fetch }
}
