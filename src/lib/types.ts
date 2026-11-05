export interface Team {
  id: string
  name: string
  score: number
}

export interface Question {
  text: string
  answer: string
  value: number
  played: boolean
}

export interface Category {
  id: string
  title: string
  questions: Question[]
}

export type CellRef = { cat: number; q: number }

export type Screen = 'setup' | 'board' | 'question' | 'results'

export interface GameSnapshot {
  screen: Screen
  teams: Team[]
  board: Category[]
  openCell: CellRef | null
  /** Сколько неверных ответов уже засчитано команде по открытому вопросу. */
  attempts: Record<string, number>
  answerRevealed: boolean
}

export interface GameState extends GameSnapshot {
  history: GameSnapshot[]
}
