<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  export let isOpen = false;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal modal-open" transition:fade={{ duration: 150 }}>
    <div class="modal-box max-w-2xl flex flex-col max-h-[85vh]">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10" on:click={() => isOpen = false}>✕</button>
      <div class="overflow-y-auto pr-4 -mr-4">
        <div class="prose">
          <slot />
        </div>
      </div>
    </div>
    <div 
      class="modal-backdrop bg-black/30" 
      on:click={() => isOpen = false}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') isOpen = false; }}
      role="button"
      tabindex="0"
    ></div>
  </div>
{/if}
