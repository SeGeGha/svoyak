<script lang="ts">
  import { game } from '../state/game.svelte'
  import { MAX_ATTEMPTS } from '../transitions'
  import Button from '../components/ui/button.svelte'
  import Scoreboard from './Scoreboard.svelte'

  const question = $derived(game.currentQuestion)
  const revealed = $derived(game.state.answerRevealed)
  const attempts = $derived(game.state.attempts)
</script>

<main class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
  <Scoreboard />

  {#if question}
    <div class="flex flex-1 flex-col items-center justify-between gap-8 rounded-xl border p-10 text-center {revealed ? 'bg-green-700' : ''}">

      <!-- ВЕРХ: лейбл + вопрос + кнопка (Показать ответ / Назад к вопросам) -->
      <div class="flex w-full flex-col items-center gap-4">
        <div class="text-m uppercase tracking-widest opacity-60">
          Вопрос на {question.value}
        </div>
        <p class="max-w-4xl text-4xl font-medium leading-snug break-words">
          {question.text}
        </p>

        {#if revealed}
          <Button size="lg" onclick={() => game.closeQuestion()} variant="secondary" class="bg-gray-700/60">
            Назад к вопросам
          </Button>
        {:else}
          <Button variant="secondary" size="lg" onclick={() => game.revealAnswer()}>
            Показать ответ
          </Button>
        {/if}
      </div>

      <!-- ЦЕНТР: ответ (только когда показан); flex-1 держит его по центру -->
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        {#if revealed}
          <p class="max-w-4xl rounded-lg bg-green-700 px-6 py-4 text-6xl font-semibold text-white break-words">
            {question.answer}
          </p>
        {/if}
      </div>

      <!-- НИЗ: команды -->
      <div class="flex w-full flex-wrap justify-center gap-3">
        {#each game.state.teams as team (team.id)}
          {@const left = Math.max(0, MAX_ATTEMPTS - (attempts[team.id] ?? 0))}
          {@const canScore = !revealed && left > 0}
          <div class="flex flex-col items-center gap-1 rounded-lg border px-3 py-2">
            <div class="flex items-center gap-2">
              <span class="max-w-40 truncate">{team.name}</span>
              <Button
                size="sm"
                variant="secondary"
                disabled={!canScore}
                onclick={() => game.award(team.id, -1)}
              >
                −{question.value}
              </Button>
              <Button size="sm" disabled={!canScore} onclick={() => game.award(team.id, 1)}>
                +{question.value}
              </Button>
            </div>
            <span class="text-xs opacity-60">попыток: {left}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="text-center">
      <Button variant="ghost" onclick={() => game.cancelQuestion()}>
        Отмена (вернуться к полю, не закрывая ячейку)
      </Button>
    </div>
  {/if}
</main>