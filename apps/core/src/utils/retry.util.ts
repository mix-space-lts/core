/**
 * Returns a `retryStrategy` function for ioredis that caps retries,
 * along with a flag that becomes true when retries are exhausted.
 * When max attempts are exceeded, returns `null` (ioredis stops retrying and emits 'close').
 */
export function cappedRetryStrategy(
  maxAttempts: number,
  baseIntervalMs: number = 200,
  label: string = 'Redis',
) {
  let gaveUp = false
  const strategy = (times: number) => {
    if (times > maxAttempts) {
      gaveUp = true
      console.error(
        `[${label}] retry limit reached (${maxAttempts} attempts), giving up`,
      )
      return null
    }
    return Math.min(times * baseIntervalMs, 5000)
  }
  strategy.gaveUp = () => gaveUp
  return strategy
}

/**
 * Type for the retry strategy function returned by cappedRetryStrategy.
 */
export type CappedRetryStrategy = ReturnType<typeof cappedRetryStrategy>

/**
 * Crash the process with a clear message so the orchestrator can restart.
 */
export function crashOnRetryExhausted(label: string): void {
  console.error(
    `[${label}] Reconnect attempts exhausted after max retries. Crashing process so orchestrator can restart.`,
  )
  process.exit(1)
}
