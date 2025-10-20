import { writable } from 'svelte/store';

// Store to hold the selected role on the market insights page
export const selectedMarketRole = writable<string>('');
