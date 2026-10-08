/** 遊んだ時間をはかる（一時停止中・画面を見ていないときは数えない）。「きゅうけい しよう」の声かけに使う */
import { useEffect, useRef } from 'react'
import { addPlayed } from './playtime'

/** 返すのは、この画面で遊んだ秒数（止めていた時間は数えない）。0 に戻すと、そこから数えなおす */
export function usePlayClock(paused: boolean): { current: number } {
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const sec = useRef(0)
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current && document.visibilityState === 'visible') {
        addPlayed(1)
        sec.current += 1
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return sec
}
