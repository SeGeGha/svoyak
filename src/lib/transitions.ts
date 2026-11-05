import type { Category, CellRef, GameSnapshot, GameState, Team } from './types'
import type { ContentPool } from './content/loader'

export const QUESTION_VALUES = [100, 200, 300, 400, 500] as const
export const BOARD_COLS = 6
export const MIN_TEAMS = 2
export const MAX_TEAMS = 5
export const MAX_TEAM_NAME = 30
export const HISTORY_LIMIT = 100
export const MAX_ATTEMPTS = 3

export function initialState(): GameState {
  return {
    screen: 'setup',
    teams: [],
    board: [],
    openCell: null,
    attempts: {},
    answerRevealed: false,
    history: []
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function canStart(teams: Team[]): boolean {
  return (
    teams.length >= MIN_TEAMS &&
    teams.length <= MAX_TEAMS &&
    teams.every((t) => t.name.trim().length > 0)
  )
}

export function addTeam(state: GameState, name: string): GameState {
  const trimmed = name.trim().slice(0, MAX_TEAM_NAME)
  if (!trimmed || state.teams.length >= MAX_TEAMS) return state
  if (state.teams.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return state
  return { ...state, teams: [...state.teams, { id: makeId(), name: trimmed, score: 0 }] }
}

export function removeTeam(state: GameState, teamId: string): GameState {
  return { ...state, teams: state.teams.filter((t) => t.id !== teamId) }
}

function snapshotOf(state: GameState): GameSnapshot {
  return {
    screen: state.screen,
    teams: state.teams.map((t) => ({ ...t })),
    board: state.board.map((c) => ({ ...c, questions: c.questions.map((q) => ({ ...q })) })),
    openCell: state.openCell ? { ...state.openCell } : null,
    attempts: { ...state.attempts },
    answerRevealed: state.answerRevealed
  }
}

function withHistory(state: GameState): GameState {
  return { ...state, history: [...state.history, snapshotOf(state)].slice(-HISTORY_LIMIT) }
}

/** Откатывает последнее действие: счёт, статус ячейки, экран. */
export function undo(state: GameState): GameState {
  const prev = state.history.at(-1)
  if (!prev) return state
  return { ...prev, history: state.history.slice(0, -1) }
}

/** Собирает раунд: 5 случайных категорий, стоимости по позиции 100–500. */
export function startGame(state: GameState, pool: ContentPool): GameState {
  if (!canStart(state.teams)) return state
  if (pool.categories.length < BOARD_COLS) {
    throw new Error(`Нужно минимум ${BOARD_COLS} категорий в пуле, есть ${pool.categories.length}`)
  }
  const picked = shuffle(pool.categories).slice(0, BOARD_COLS)
  const board: Category[] = picked.map((c) => ({
    id: c.id,
    title: c.title,
    questions: c.questions.map((q, i) => ({
      text: q.text,
      answer: q.answer,
      value: QUESTION_VALUES[i],
      played: false
    }))
  }))
  return { ...state, board, screen: 'board', openCell: null, history: [] }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

export function openQuestion(state: GameState, cell: CellRef): GameState {
  if (state.screen !== 'board') return state
  const q = state.board[cell.cat]?.questions[cell.q]
  if (!q || q.played) return state
  return {
    ...withHistory(state),
    openCell: cell,
    screen: 'question',
    attempts: {},
    answerRevealed: false
  }
}

export function remainingAttempts(state: GameState, teamId: string): number {
  return Math.max(0, MAX_ATTEMPTS - (state.attempts[teamId] ?? 0))
}

export function canAward(state: GameState, teamId: string): boolean {
  if (state.screen !== 'question' || !state.openCell || state.answerRevealed) return false
  if (!state.teams.some((t) => t.id === teamId)) return false
  return remainingAttempts(state, teamId) > 0
}

function allAttemptsExhausted(attempts: Record<string, number>, teams: Team[]): boolean {
  return teams.length > 0 && teams.every((t) => (attempts[t.id] ?? 0) >= MAX_ATTEMPTS)
}

/** Начисляет/списывает стоимость вопроса. Плюс или 3 минуса у всех команд раскрывают ответ. */
export function award(state: GameState, teamId: string, sign: 1 | -1): GameState {
  if (!canAward(state, teamId) || !state.openCell) return state
  const { cat, q } = state.openCell
  const question = state.board[cat]?.questions[q]
  if (!question || question.played) return state
  const next = withHistory(state)
  const teams = next.teams.map((t) =>
    t.id === teamId ? { ...t, score: t.score + sign * question.value } : t
  )
  const attempts =
    sign === -1
      ? { ...next.attempts, [teamId]: (next.attempts[teamId] ?? 0) + 1 }
      : next.attempts
  const answerRevealed = sign === 1 || allAttemptsExhausted(attempts, teams)
  return { ...next, teams, attempts, answerRevealed }
}

export function revealAnswer(state: GameState): GameState {
  if (state.screen !== 'question' || !state.openCell || state.answerRevealed) return state
  return { ...withHistory(state), answerRevealed: true }
}

/** Закрывает ячейку после показа ответа и возвращает к полю. */
export function closeQuestion(state: GameState): GameState {
  if (state.screen !== 'question' || !state.openCell || !state.answerRevealed) return state
  const { cat, q } = state.openCell
  const next = withHistory(state)
  const board = next.board.map((c, ci) =>
    ci !== cat
      ? c
      : { ...c, questions: c.questions.map((qq, qi) => (qi !== q ? qq : { ...qq, played: true })) }
  )
  return {
    ...next,
    board,
    openCell: null,
    attempts: {},
    answerRevealed: false,
    screen: isBoardComplete(board) ? 'results' : 'board'
  }
}

export function isBoardComplete(board: Category[]): boolean {
  return board.length > 0 && board.every((c) => c.questions.every((q) => q.played))
}
