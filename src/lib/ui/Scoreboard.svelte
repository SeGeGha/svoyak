<script lang="ts">
  import { game } from '../state/game.svelte'
</script>

<div class="flex flex-wrap justify-center gap-3">
  {#each game.state.teams as team (team.id)}
    <div class="rounded-lg border px-4 py-2 text-center">
      <div class="text-sm opacity-70">{team.name}</div>
      <div class="text-2xl font-bold {team.score < 0 ? 'text-destructive' : ''}">{team.score}</div>
    </div>
  {/each}
</div>
