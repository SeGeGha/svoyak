export interface RawQuestion {
  text: string
  answer: string
}

export interface RawCategory {
  id: string
  title: string
  questions: RawQuestion[]
}

export interface ContentPool {
  categories: RawCategory[]
}

export const QUESTIONS_PER_CATEGORY = 5

/** Проверяет пул контента. Возвращает список ошибок (пустой = ок). */
export function validatePool(pool: unknown): string[] {
  const errors: string[] = []
  const p = pool as ContentPool | null
  if (!p || !Array.isArray(p.categories)) {
    return ['Контент: ожидается объект { categories: [...] }']
  }
  p.categories.forEach((c, i) => {
    const label = c?.title || `категория #${i + 1}`
    if (!c?.id || !c.title) errors.push(`Категория #${i + 1}: нужны непустые id и title`)
    if (!Array.isArray(c.questions) || c.questions.length !== QUESTIONS_PER_CATEGORY) {
      errors.push(`Категория "${label}": нужно ровно ${QUESTIONS_PER_CATEGORY} вопросов`)
      return
    }
    c.questions.forEach((q, j) => {
      if (!q?.text?.trim() || !q?.answer?.trim()) {
        errors.push(`Категория "${label}": вопрос #${j + 1} — пустой text или answer`)
      }
    })
  })
  return errors
}
