import type { CellRef, GameState } from '../types'
import * as tr from '../transitions'
import * as persist from '../persistence'
import { validatePool, type ContentPool } from '../content/loader'
import rawPool from '../content/questions.json'

const pool = rawPool as ContentPool

const poolErrors = validatePool(pool)
if (poolErrors.length > 0) {
  console.error('Ошибки контента questions.json:', poolErrors)
}

class GameStore {
  state = $state<GameState>(persist.load() ?? tr.initialState())
  error = $state<string | null>(null)

  canStart = $derived(tr.canStart(this.state.teams))
  canUndo = $derived(this.state.history.length > 0)
  remainingCells = $derived(
    this.state.board.reduce((n, c) => n + c.questions.filter((q) => !q.played).length, 0)
  )
  currentQuestion = $derived(
    this.state.openCell && this.state.board[this.state.openCell.cat]
      ? this.state.board[this.state.openCell.cat].questions[this.state.openCell.q]
      : null
  )

  private commit(next: GameState) {
    this.state = next
    persist.save(next)
  }

  addTeam(name: string) {
    this.error = null
    this.commit(tr.addTeam(this.state, name))
  }

  removeTeam(teamId: string) {
    this.commit(tr.removeTeam(this.state, teamId))
  }

  start() {
    this.error = null
    try {
      this.commit(tr.startGame(this.state, pool))
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
    }
  }

  open(cell: CellRef) {
    this.commit(tr.openQuestion(this.state, cell))
  }

  /** «Отмена» на экране вопроса — это undo открытия. */
  cancelQuestion() {
    this.commit(tr.undo(this.state))
  }

  award(teamId: string, sign: 1 | -1) {
    this.commit(tr.award(this.state, teamId, sign))
  }

  revealAnswer() {
    this.commit(tr.revealAnswer(this.state))
  }

  closeQuestion() {
    this.commit(tr.closeQuestion(this.state))
  }

  undo() {
    this.commit(tr.undo(this.state))
  }

  reset() {
    this.error = null
    this.state = tr.initialState()
    persist.clear()
  }
}

export const game = new GameStore()
