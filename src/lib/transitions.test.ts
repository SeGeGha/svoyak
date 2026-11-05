import { describe, expect, it } from 'vitest'
import * as tr from './transitions'
import type { ContentPool } from './content/loader'

function makePool(n = 6): ContentPool {
  return {
    categories: Array.from({ length: n }, (_, i) => ({
      id: `cat-${i}`,
      title: `Категория ${i + 1}`,
      questions: Array.from({ length: 5 }, (_, j) => ({
        text: `Вопрос ${j + 1}`,
        answer: 'Ответ'
      }))
    }))
  }
}

function started(): ReturnType<typeof tr.initialState> {
  let s = tr.initialState()
  s = tr.addTeam(s, 'Альфа')
  s = tr.addTeam(s, 'Бета')
  return tr.startGame(s, makePool())
}

describe('команды', () => {
  it('добавляет валидную команду, обрезает пробелы', () => {
    const s = tr.addTeam(tr.initialState(), '  Альфа  ')
    expect(s.teams).toHaveLength(1)
    expect(s.teams[0].name).toBe('Альфа')
    expect(s.teams[0].score).toBe(0)
  })

  it('игнорирует пустое и дублирующее (без учёта регистра) название', () => {
    let s = tr.addTeam(tr.initialState(), 'Альфа')
    s = tr.addTeam(s, '   ')
    s = tr.addTeam(s, 'альфа')
    expect(s.teams).toHaveLength(1)
  })

  it('не даёт добавить больше 5 команд', () => {
    let s = tr.initialState()
    for (let i = 0; i < 7; i++) s = tr.addTeam(s, `Команда ${i}`)
    expect(s.teams).toHaveLength(5)
  })

  it('начать можно только при 2–5 командах', () => {
    expect(tr.canStart(tr.initialState().teams)).toBe(false)
    const one = tr.addTeam(tr.initialState(), 'Одна')
    expect(tr.canStart(one.teams)).toBe(false)
    expect(tr.canStart(started().teams)).toBe(true)
  })
})

describe('игровое поле', () => {
  it('строит поле 5×5 со стоимостями 100–500', () => {
    const s = started()
    expect(s.board).toHaveLength(5)
    for (const c of s.board) {
      expect(c.questions).toHaveLength(5)
      expect(c.questions.map((q) => q.value)).toEqual([100, 200, 300, 400, 500])
      expect(c.questions.every((q) => !q.played)).toBe(true)
    }
  })

  it('требует минимум 5 категорий в пуле', () => {
    let s = tr.initialState()
    s = tr.addTeam(s, 'А')
    s = tr.addTeam(s, 'Б')
    expect(() => tr.startGame(s, makePool(4))).toThrow()
  })
})

describe('ход и счёт', () => {
  it('открытие вопроса и отмена (undo) возвращают ячейку в игру', () => {
    let s = started()
    s = tr.openQuestion(s, { cat: 0, q: 0 })
    expect(s.screen).toBe('question')
    s = tr.undo(s)
    expect(s.screen).toBe('board')
    expect(s.board[0].questions[0].played).toBe(false)
  })

  it('плюс раскрывает ответ, ячейка закрывается только после возврата', () => {
    let s = started()
    const teamId = s.teams[0].id
    s = tr.openQuestion(s, { cat: 2, q: 3 })
    s = tr.award(s, teamId, 1)
    expect(s.teams[0].score).toBe(400)
    expect(s.answerRevealed).toBe(true)
    expect(s.screen).toBe('question')
    expect(s.board[2].questions[3].played).toBe(false)
    s = tr.closeQuestion(s)
    expect(s.board[2].questions[3].played).toBe(true)
    expect(s.screen).toBe('board')
    expect(s.openCell).toBeNull()
  })

  it('минус не закрывает вопрос и не показывает ответ', () => {
    let s = started()
    const teamId = s.teams[1].id
    s = tr.openQuestion(s, { cat: 0, q: 4 })
    s = tr.award(s, teamId, -1)
    expect(s.teams[1].score).toBe(-500)
    expect(s.answerRevealed).toBe(false)
    expect(s.screen).toBe('question')
    expect(s.attempts[teamId]).toBe(1)
  })

  it('после 3 минусов у всех команд показывается ответ', () => {
    let s = started()
    const [a, b] = s.teams
    s = tr.openQuestion(s, { cat: 0, q: 0 })
    for (let i = 0; i < 3; i++) s = tr.award(s, a.id, -1)
    expect(s.answerRevealed).toBe(false)
    for (let i = 0; i < 2; i++) s = tr.award(s, b.id, -1)
    expect(s.answerRevealed).toBe(false)
    s = tr.award(s, b.id, -1)
    expect(s.answerRevealed).toBe(true)
    expect(s.teams[0].score).toBe(-300)
    expect(s.teams[1].score).toBe(-300)
  })

  it('четвёртая попытка команды игнорируется', () => {
    let s = started()
    const teamId = s.teams[0].id
    s = tr.openQuestion(s, { cat: 0, q: 0 })
    for (let i = 0; i < 4; i++) s = tr.award(s, teamId, -1)
    expect(s.attempts[teamId]).toBe(3)
    expect(s.teams[0].score).toBe(-300)
  })

  it('кнопка «показать ответ» раскрывает ответ без смены счёта', () => {
    let s = started()
    s = tr.openQuestion(s, { cat: 1, q: 1 })
    s = tr.revealAnswer(s)
    expect(s.answerRevealed).toBe(true)
    expect(s.teams.every((t) => t.score === 0)).toBe(true)
    s = tr.closeQuestion(s)
    expect(s.board[1].questions[1].played).toBe(true)
    expect(s.screen).toBe('board')
  })

  it('undo откатывает и счёт, и статус ячейки', () => {
    let s = started()
    const teamId = s.teams[0].id
    s = tr.openQuestion(s, { cat: 1, q: 1 })
    s = tr.award(s, teamId, 1)
    s = tr.closeQuestion(s)
    s = tr.undo(s)
    expect(s.teams[0].score).toBe(200)
    expect(s.board[1].questions[1].played).toBe(false)
    expect(s.screen).toBe('question')
    s = tr.undo(s)
    expect(s.teams[0].score).toBe(0)
    expect(s.screen).toBe('question')
  })

  it('после всех 25 ячеек — экран результатов', () => {
    let s = started()
    const teamId = s.teams[0].id
    for (let c = 0; c < 5; c++) {
      for (let q = 0; q < 5; q++) {
        s = tr.openQuestion(s, { cat: c, q })
        s = tr.award(s, teamId, 1)
        s = tr.closeQuestion(s)
      }
    }
    expect(s.screen).toBe('results')
    expect(s.teams[0].score).toBe(7500)
  })
})
