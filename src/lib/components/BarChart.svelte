<script lang="ts">
  import { Bar } from 'svelte-chartjs';
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
  import type { ChartData, ChartOptions } from 'chart.js';

  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

  export let data: ChartData<"bar">;

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = context.parsed.y;
              const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              label += `${value} (${percentage}%)`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#9ca3af', // text-gray-400
        },
        grid: {
          color: '#374151', // gray-700
        }
      },
      x: {
        ticks: {
          color: '#9ca3af', // text-gray-400
        },
        grid: {
          display: false,
        }
      }
    }
  };
</script>

<div style="height: 400px;">
  <Bar {data} {options} />
</div>