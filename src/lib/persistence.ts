import type { GameState } from './types'

export const STORAGE_KEY = 'svoya-igra-med:v1'
export const STATE_VERSION = 2

export function serialize(state: GameState): string {
  return JSON.stringify({ version: STATE_VERSION, state })
}

function isValidState(s: unknown): s is GameState {
  if (!s || typeof s !== 'object') return false
  const g = s as GameState
  return (
    typeof g.screen === 'string' &&
    Array.isArray(g.teams) &&
    Array.isArray(g.board) &&
    Array.isArray(g.history) &&
    typeof g.answerRevealed === 'boolean' &&
    g.attempts !== null &&
    typeof g.attempts === 'object' &&
    !Array.isArray(g.attempts)
  )
}

/** Возвращает состояние или null (битые данные, чужая версия схемы). */
export function deserialize(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== STATE_VERSION || !isValidState(parsed.state)) return null
    return parsed.state
  } catch {
    return null
  }
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state))
  } catch {
    // переполнение storage / приватный режим — игра продолжается в памяти
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? deserialize(raw) : null
  } catch {
    return null
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
