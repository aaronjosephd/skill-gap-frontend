<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let value = 0;
    export let size = '3.5rem';
    export let thickness = '4px';
    export let colorClass = 'text-primary';

    const tweenedValue = tweened(0, {
        duration: 800,
        easing: cubicOut
    });

    $: {
        if (value !== undefined) {
            tweenedValue.set(value);
        }
    }
</script>

<div 
    class="radial-progress {colorClass}" 
    style="--value:{$tweenedValue * 100}; --size:{size}; --thickness:{thickness};"
    title="{Math.round(value * 100)}% similarity"
>
    <span class="text-sm font-bold">{Math.round($tweenedValue * 100)}%</span>
</div>
