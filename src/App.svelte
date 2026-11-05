<script lang="ts">
  import { game } from '$lib/state/game.svelte'
  import SetupScreen from '$lib/ui/SetupScreen.svelte'
  import BoardScreen from '$lib/ui/BoardScreen.svelte'
  import QuestionScreen from '$lib/ui/QuestionScreen.svelte'
  import ResultsScreen from '$lib/ui/ResultsScreen.svelte'
</script>

{#if game.state.screen === 'setup'}
  <SetupScreen />
{:else if game.state.screen === 'board'}
  <BoardScreen />
{:else if game.state.screen === 'question'}
  <QuestionScreen />
{:else}
  <ResultsScreen />
{/if}
