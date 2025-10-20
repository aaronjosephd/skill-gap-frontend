<script lang="ts">
    import { fly } from 'svelte/transition';
    export let title: string;
    export let delay: number = 0;
    export let isLoading: boolean = false;
    export let cardClass: string = '';
</script>

{#if isLoading}
    <div class="skeleton h-96 w-full"></div>
{:else}
    <div in:fly={{ y: 20, duration: 400, delay }} class="card bg-base-100 shadow-lg border border-base-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 {cardClass}">
        <div class="card-body p-6">
            <h2 class="card-title text-2xl">{title}</h2>
            <div class="h-full">
                <slot name="content"></slot>
            </div>
            <div class="mt-4">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
{/if}
