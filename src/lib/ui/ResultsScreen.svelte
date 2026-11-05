<script lang="ts">
  import { game } from '../state/game.svelte'
  import Button from '../components/ui/button.svelte'

  const sorted = $derived([...game.state.teams].sort((a, b) => b.score - a.score))
  const maxScore = $derived(sorted[0]?.score ?? 0)
  const winners = $derived(sorted.filter((t) => t.score === maxScore))
  const singleWinner = $derived(winners.length === 1 ? winners[0] : null)
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-6">
  <h1 class="text-4xl font-bold">Итоги игры</h1>

  <ul class="w-full space-y-3">
    {#each sorted as team, i (team.id)}
      <li
        class="flex items-center justify-between rounded-lg border px-5 py-4 text-xl {singleWinner?.id ===
        team.id
          ? 'border-primary bg-primary/10'
          : ''}"
      >
        <span class="flex items-center gap-3">
          <span class="opacity-50">{i + 1}.</span>
          {team.name}
          {#if singleWinner?.id === team.id}<span>🏆</span>{/if}
        </span>
        <span class="font-bold {team.score < 0 ? 'text-destructive' : ''}">{team.score}</span>
      </li>
    {/each}
  </ul>

  {#if winners.length > 1}
    <p class="text-lg opacity-70">Ничья: {winners.map((w) => w.name).join(', ')}</p>
  {/if}

  <Button size="lg" onclick={() => game.reset()}>Новая игра</Button>
</main>
