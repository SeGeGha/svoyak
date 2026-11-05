import { describe, expect, it } from 'vitest'
import { deserialize, serialize } from './persistence'
import * as tr from './transitions'

describe('persistence', () => {
  it('round-trip: сериализация → десериализация', () => {
    let s = tr.initialState()
    s = tr.addTeam(s, 'Альфа')
    s = tr.addTeam(s, 'Бета')
    const restored = deserialize(serialize(s))
    expect(restored?.teams.map((t) => t.name)).toEqual(['Альфа', 'Бета'])
    expect(restored?.screen).toBe('setup')
  })

  it('отклоняет битый JSON и чужую версию схемы', () => {
    expect(deserialize('not json at all')).toBeNull()
    expect(deserialize(JSON.stringify({ version: 999, state: { screen: 'setup' } }))).toBeNull()
    expect(deserialize(JSON.stringify({ version: 2, state: { screen: 42 } }))).toBeNull()
  })
})
