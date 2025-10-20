<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    export let value = 0;
    export let size = '12rem';
    export let thickness = '1.2rem';
    export let colorClass = 'text-accent';

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
    style="--value:{$tweenedValue * 10}; --size:{size}; --thickness:{thickness};"
>
    <span class="text-5xl font-bold">{$tweenedValue.toFixed(1)}</span>
</div>
