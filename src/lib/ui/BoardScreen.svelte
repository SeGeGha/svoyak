<script lang="ts">
  import { game } from '../state/game.svelte'
  import Button from '../components/ui/button.svelte'
  import Scoreboard from './Scoreboard.svelte'

  let confirmReset = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function handleReset() {
    if (confirmReset) {
      clearTimeout(timer)
      confirmReset = false
      game.reset()
    } else {
      confirmReset = true
      timer = setTimeout(() => (confirmReset = false), 3000)
    }
  }
</script>

<main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
  <header class="flex flex-col items-center gap-3">
    <Scoreboard />
    <div class="flex items-center gap-4 text-sm opacity-70">
      <span>Осталось вопросов: {game.remainingCells}</span>
      <Button variant="ghost" size="sm" disabled={!game.canUndo} onclick={() => game.undo()}>
        Отменить действие
      </Button>
      <Button
        variant={confirmReset ? 'destructive' : 'ghost'}
        size="sm"
        onclick={handleReset}
      >
        {confirmReset ? 'Точно сбросить игру?' : 'Сбросить игру'}
      </Button>
    </div>
  </header>

  <div class="grid flex-1 grid-cols-6 gap-2">
    {#each game.state.board as category (category.id)}
      <div class="cell cell-header flex items-center justify-center text-center">
        {category.title}
      </div>
    {/each}
    {#each [0, 1, 2, 3, 4] as row}
      {#each game.state.board as category, ci (category.id)}
        {@const question = category.questions[row]}
        <button
          class="cell cell-value"
          disabled={question.played}
          onclick={() => game.open({ cat: ci, q: row })}
        >
          {question.played ? '—' : question.value}
        </button>
      {/each}
    {/each}
  </div>
</main>

<style>
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    padding: 1.25rem 0.5rem;
    min-height: 4.5rem;
    font-size: 1.75rem;
    font-weight: 700;
  }
  .cell-header {
    background: color-mix(in oklab, var(--primary) 80%, black);
    color: white;
    text-transform: uppercase;
    font-size: 1.1rem;
    letter-spacing: 0.02em;
  }
  .cell-value {
    background: var(--primary);
    color: white;
    cursor: pointer;
    transition: filter 0.15s ease;
  }
  .cell-value:hover:not(:disabled) {
    filter: brightness(1.15);
  }
  .cell-value:disabled {
    background: var(--muted);
    color: transparent;
    cursor: default;
  }
</style>
