<script lang="ts">
  import { game } from '../state/game.svelte'
  import { MAX_TEAMS, MAX_TEAM_NAME } from '../transitions'
  import Button from '../components/ui/button.svelte'

  let draftName = $state('')

  function submit(e: Event) {
    e.preventDefault()
    game.addTeam(draftName)
    draftName = ''
  }
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6">
  <h1 class="text-4xl font-bold">Своя игра — СМП</h1>
  <p class="opacity-70">Добавьте от 2 до {MAX_TEAMS} команд, затем начните игру</p>

  <form onsubmit={submit} class="flex w-full gap-2">
    <input
      bind:value={draftName}
      maxlength={MAX_TEAM_NAME}
      placeholder="Название команды"
      class="flex-1 rounded-md border bg-transparent px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-ring"
    />
    <Button type="submit" variant="secondary">Добавить</Button>
  </form>

  <ul class="w-full space-y-2">
    {#each game.state.teams as team (team.id)}
      <li class="flex items-center justify-between rounded-md border px-4 py-3 text-lg">
        <span>{team.name}</span>
        <Button variant="ghost" size="sm" onclick={() => game.removeTeam(team.id)}>Удалить</Button>
      </li>
    {/each}
  </ul>

  {#if game.error}
    <p class="text-destructive">{game.error}</p>
  {/if}

  <Button size="lg" disabled={!game.canStart} onclick={() => game.start()}>Начать игру</Button>
</main>
