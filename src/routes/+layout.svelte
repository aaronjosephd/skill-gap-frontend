<script>
  import "../app.css";
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import Modal from '$lib/components/Modal.svelte';

  let showScrollToTop = false;
  let isAboutModalOpen = false;

  function handleScroll() {
    showScrollToTop = window.scrollY > 200;
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    const themeController = document.querySelector('.theme-controller');
    if (themeController) {
      const currentTheme = localStorage.getItem('theme') || 'light';
      themeController.checked = currentTheme === 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);

      themeController.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      });
    }
  });
</script>

<svelte:window on:scroll={handleScroll} />

<div class="navbar bg-base-100 shadow-md px-4 md:px-8">
  <div class="navbar-start">
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </div>
      <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li><a href="/market">Market Insights</a></li>
        <li><a href="/analyze">Resume Analysis</a></li>
        <li><button on:click={() => isAboutModalOpen = true}>About</button></li>
      </ul>
    </div>
    <a href="/" class="btn btn-ghost text-xl normal-case">IT Skill Gap Analyzer</a>
  </div>
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a href="/market">Market Insights</a></li>
      <li><a href="/analyze">Resume Analysis</a></li>
      <li><button on:click={() => isAboutModalOpen = true}>About</button></li>
    </ul>
  </div>
  <div class="navbar-end">
    <label for="theme-toggle" class="flex cursor-pointer gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      <input type="checkbox" id="theme-toggle" value="dark" class="toggle theme-controller"/>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
    </label>
  </div>
</div>

<Modal bind:isOpen={isAboutModalOpen}>
    <h3 class="font-bold text-lg">About the Project and Its Data</h3>
<p class="py-4">
    This prototype is the final output of the undergraduate thesis titled, <strong>"Contextual IT Skill Gap Analysis Between Job Postings and Resumes in the Philippine Tech Industry."</strong>
</p>



<div class="divider"></div>

<h4 class="font-bold text-md">Data Source and Scope</h4>
<ul class="list-disc list-inside space-y-2 py-2">
    <li>
        <strong>Source:</strong> The data comes from publicly available IT job postings on <strong>Indeed</strong> and <strong>LinkedIn</strong>.
    </li>
    <li>
        <strong>Region:</strong> The analysis is focused only on the job market within the <strong>Philippines</strong>.
    </li>
    <li>
        <strong>Collection Period:</strong> Data was gathered between <strong>August 20, 2025, and September 19, 2025</strong>.
    </li>
    <li>
        <strong>Data Recency:</strong> The search was limited to job postings published on or after <strong>January 1, 2025</strong>, to ensure the data is current.
    </li>
    <li>
        <strong>Final Dataset Size:</strong> The insights you see here are based on a final, cleaned dataset of <strong>8,852 unique job postings</strong>.
    </li>
</ul>

<div class="divider"></div>

<h4 class="font-bold text-md">Data Collection and Processing</h4>
<p class="py-2">
    To ensure data quality, the collected information went through a multi step process based on the Cross Industry Standard Process for Data Mining (CRISP DM):
</p>
<ol class="list-decimal list-inside space-y-2">
    <li>
        <strong>Initial Collection:</strong> A total of <strong>27,661 job postings</strong> were originally collected. The search terms were based on official job roles for CS, IS AND IT graduates as defined by CHED Memorandum Order (CMO). No. 25: Series of 2015.
    </li>
    <li>
        <strong>Cleaning and Deduplication:</strong> Textual noise, such as HTML tags and irrelevant characters, was removed from the text, and all duplicate job postings were deleted, leaving 18,490 unique entries.
    </li>
    <li>
        <strong>Relevance Filtering:</strong> The <strong>JobBERT v2</strong> model was used to understand the meaning of each job title. Only jobs that were a very close match to the official CHED roles were kept, resulting in 9,543 relevant jobs.
    </li>
    <li>
        <strong>Final Dataset Selection:</strong> To create a balanced dataset for training the DistilBERT NER model, a minimum of 200 postings per job role was required. Only the roles meeting this threshold were included, resulting in the final dataset of <strong>8,852 postings</strong>.
    </li>
</ol>

<div class="divider"></div>

<h4 class="font-bold text-md">How The Analysis Works</h4>
<p class="py-2">
    The core of this system is a custom trained Natural Language Processing (NLP) model. This <strong>DistilBERT based model</strong> was trained to read the text of each job posting and automatically find and label three key types of information:
</p>
<ul class="list-disc list-inside space-y-2 py-2">
    <li><span class="badge badge-primary">SKILL</span> (e.g., Python, SQL, Agile)</li>
    <li><span class="badge badge-secondary">TOOL</span> (e.g., AWS, Azure, Jira)</li>
    <li><span class="badge badge-accent">EXPERIENCE</span> (e.g., 3 to 5 years, 2 years)</li>
</ul>
<p class="pt-2">
    By analyzing this extracted information from thousands of job posts, the system provides a detailed look at what employers are looking for. This gives a much clearer picture of the job market in the Philippine Tech Industry.
</p>

<div class="divider"></div>

<h4 class="font-bold text-md">Important Limitations</h4>
<ul class="list-disc list-inside space-y-2 py-2">
    <li>
        <strong>Not Exhaustive:</strong> The data is a large sample but does not represent every single IT job posting in the Philippines during the collection period.
    </li>
    <li>
        <strong>Focus on Technical Skills:</strong> The automated analysis intentionally focuses on extracting technical skills, tools, and experience. Soft skills are not part of this analysis.
    </li>
    <li>
        <strong>Prototype System:</strong> This is a functional prototype built to demonstrate the thesis methodology and the performance of the DistilBERT NER model. It is not a commercial grade product.
    </li>
    <li>
        <strong>NER Model Performance:</strong> The model for extracting skills, tools, and experience has been fine-tuned and evaluated, but like any machine learning model, it is not 100% perfect.
    </li>
</ul>

<div class="divider"></div>
<p class="text-sm text-center pt-4">
    A Thesis by: Domingo, Aaron Joseph; Flores, Harold; and Tuengan, Barry Fritz
</p>
</Modal>

<main class="p-4 md:p-8 relative">
  {#key $page.url.pathname}
    <div in:fly={{ y: 20, duration: 300, delay: 300 }} out:fade={{ duration: 300 }}>
      <slot />
    </div>
  {/key}

  {#if showScrollToTop}
    <button
      transition:fade={{ duration: 200 }}
      on:click={scrollToTop}
      class="btn btn-primary btn-circle fixed bottom-8 right-8 z-50 shadow-lg"
      aria-label="Scroll to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  {/if}
</main>

<footer class="footer footer-center p-6 bg-base-300 text-base-content">
  <aside>
    <p>Copyright © 2025 - DOMINGO, Aaron Joseph | FLORES, Harold | TUENGAN, Barry Fritz</p>
  </aside>
</footer>