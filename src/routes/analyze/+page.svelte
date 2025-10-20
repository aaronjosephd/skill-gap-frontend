<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { analyzeResume, getRoles, getMoreSimilarJobs } from '$lib/api';
    import type { AnalysisResult } from '$lib/types';
    import AnimatedRadialProgress from '$lib/components/AnimatedRadialProgress.svelte';

    let resumeFile: FileList | null = null;
    let analysisResult: AnalysisResult | null = null;
    let isLoading = false;
    let error: string | null = null;

    let roles: string[] = [];
    let selectedRole: string = "Overall Market";

    // --- State for new pagination logic ---
    let sessionId: string | null = null;
    let similarJobsPage = 1;
    let isLoadingMoreJobs = false;

    // --- Pagination State for other sections ---
    let missingSkillsLimit = 10;
    let missingToolsLimit = 10;

    // --- For Multi-Step Progress Indicator ---
    const progressMessages = [
        '[1/4] Processing PDF document...',
        '[2/4] Extracting skills & tools with NER model...',
        '[3/4] Performing market gap analysis...',
        '[4/4] Generating final recommendations...'
    ];
    let currentProgressMessage = '';
    let progressInterval: any;

    function startProgressIndicator() {
        let i = 0;
        currentProgressMessage = progressMessages[i];
        progressInterval = setInterval(() => {
            i++;
            if (i >= progressMessages.length) i = 0; 
            currentProgressMessage = progressMessages[i];
        }, 2500);
    }

    function stopProgressIndicator() {
        clearInterval(progressInterval);
    }

    onMount(async () => {
        try {
            roles = await getRoles();
        } catch (e) {
            console.error("Failed to fetch roles:", e);
        }
    });

    // Core analysis function
    async function handleSubmit() {
        if (!resumeFile || resumeFile.length === 0) {
            error = "Please select a resume file (PDF only).";
            return;
        }
        const file = resumeFile[0];
        if (file.type !== 'application/pdf') {
            error = "Invalid file type. Please upload a PDF.";
            return;
        }

        const maxSize = 1 * 1024 * 1024; // 1MB
        if (file.size > maxSize) {
            error = "File is too large. Please upload a PDF under 1MB.";
            return;
        }

        isLoading = true;
        error = null;
        startProgressIndicator();

        const formData = new FormData();
        formData.append('resume_file', file);
        formData.append('target_role', selectedRole);

        try {
            const result = await analyzeResume(formData);
            analysisResult = result;
            sessionId = result.session_id; // Save the session ID
        } catch (e) {
            if (e instanceof Error) {
                error = `Analysis Failed: ${e.message}`;
            } else {
                error = "An unknown error occurred during analysis.";
            }
        } finally {
            isLoading = false;
            stopProgressIndicator();
        }
    }

    // Wrapper for new form submissions
    async function newAnalysis() {
        // Reset all state for a fresh analysis
        analysisResult = null;
        sessionId = null;
        similarJobsPage = 1;
        await handleSubmit();
    }

    // New function for efficient pagination
    async function showMoreJobs() {
        if (!sessionId || !analysisResult) return;

        isLoadingMoreJobs = true;
        similarJobsPage++;
        
        try {
            const newJobs = await getMoreSimilarJobs(sessionId, similarJobsPage);
            if (newJobs.length > 0) {
                analysisResult.similar_jobs = [...analysisResult.similar_jobs, ...newJobs];
            }
        } catch (e) {
            if (e instanceof Error) {
                error = `Failed to load more jobs: ${e.message}`;
            } else {
                error = "An unknown error occurred while fetching more jobs.";
            }
            similarJobsPage--; // Decrement page on error
        } finally {
            isLoadingMoreJobs = false;
        }
    }
</script>

<div class="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
    <div class="text-center mb-16">
        <h1 class="text-5xl md:text-6xl font-extrabold mb-2">Resume Gap Analysis</h1>
        <p class="text-lg md:text-xl text-base-content/70">Analyze your resume against the job market to discover your strengths, weaknesses, and opportunities.</p>
    </div>

    <div class="card bg-base-100 shadow-lg border border-base-300 mb-16">
        <div class="card-body p-6 md:p-8">
            <form on:submit|preventDefault={newAnalysis} class="space-y-6">
                <div>
                    <label class="label" for="target-role">
                        <span class="label-text text-base font-semibold">Select Target Role</span>
                    </label>
                    <select id="target-role" class="select select-bordered w-full" bind:value={selectedRole}>
                        {#each roles as role}
                            <option value={role}>{role}</option>
                        {/each}
                    </select>
                </div>
                
                <div>
                    <label class="label" for="resume-file">
                        <span class="label-text text-base font-semibold">Upload Your Resume (PDF Only)</span>
                    </label>
                    <input id="resume-file" type="file" class="file-input file-input-bordered w-full" accept=".pdf" bind:files={resumeFile} />
                </div>

                <button type="submit" class="btn btn-primary btn-lg mt-6 w-full" disabled={isLoading}>
                    {#if isLoading && !analysisResult}
                        <span class="loading loading-spinner"></span>
                    {/if}
                    Analyze Resume
                </button>
            </form>
        </div>
    </div>


    {#if isLoading}
        <div class="flex justify-center items-center p-20" transition:fade>
            <div class="flex flex-col items-center gap-4">
                <span class="loading loading-spinner loading-lg text-primary"></span>
                <p class="text-base-content/70 animate-pulse font-semibold">{currentProgressMessage}</p>
            </div>
        </div>
    {/if}

    {#if error}
        <div class="alert alert-error shadow-lg mt-8" transition:fade>
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span><strong>Error!</strong> {error}</span>
            </div>
        </div>
    {/if}

    {#if analysisResult}
        <div class="mt-12 space-y-4">
            <!-- Job Recommendations -->
            <div class="collapse collapse-arrow bg-base-100 border border-base-300 shadow-lg hover:shadow-2xl transition-shadow">
                <input type="radio" name="result-accordion" /> 
                <div class="collapse-title text-2xl font-medium">
                    Top {analysisResult.similar_jobs.length} of {analysisResult.total_similar_jobs} Similar Jobs
                </div>
                <div class="collapse-content overflow-x-auto">
                    <p class="text-base-content/70 mb-4">Based on your resume, the system has ranked all potential matches from the dataset. To ensure relevance, the top 200 most similar job postings are available for you to browse.</p>
                    <div>
                        <table class="table min-w-[700px]">
                            <thead class="bg-base-200/50">
                                <tr class="hover">
                                    <th>Job Title</th>
                                    <th class="whitespace-nowrap">Market Role Category</th>
                                    <th class="text-right whitespace-nowrap">Similarity Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each analysisResult.similar_jobs as job}
                                    <tr class="hover">
                                        <td>
                                            {#if job.url}
                                                <a href={job.url} target="_blank" rel="noopener noreferrer" class="link link-hover font-bold">{job.job_title}</a>
                                            {:else}
                                                <span class="font-bold">{job.job_title}</span>
                                            {/if}
                                        </td>
                                        <td><div class="badge badge-neutral whitespace-nowrap">{job.cmo_role_match}</div></td>
                                        <td class="text-right">
                                            <AnimatedRadialProgress value={job.similarity_score} />
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                    {#if analysisResult.similar_jobs.length < analysisResult.total_similar_jobs && analysisResult.similar_jobs.length < 200}
                        <div class="card-actions justify-center mt-4">
                            <button class="btn btn-primary" on:click={showMoreJobs} disabled={isLoadingMoreJobs}>
                                {#if isLoadingMoreJobs} <span class="loading loading-spinner"></span> {/if}
                                Show 10 More Jobs
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Gap Analysis -->
            <div class="collapse collapse-arrow bg-base-100 border-2 border-primary shadow-lg hover:shadow-2xl transition-shadow">
                                    <input type="radio" name="result-accordion" checked />
                                <div class="collapse-title text-2xl font-medium">
                    Gap Analysis: Your Profile vs. the <span class="text-primary">{selectedRole}</span> Market
                </div>
                <div class="collapse-content">
                    <p class="text-base-content/70 mb-8">This section compares the skills and tools found in your resume against the most in-demand ones for the selected market role. The "Top Gaps" are sorted by market frequency.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-4">
                        <!-- Skills Row -->
                        <div class="md:col-span-3 flex items-center gap-3 font-bold text-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                            <span>Skills Analysis</span>
                        </div>
                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md mb-3">Your Skills ({analysisResult.gap_analysis.total_user_skills})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#if analysisResult.gap_analysis.user_skills.length > 0}
                                    {#each analysisResult.gap_analysis.user_skills as skill}
                                        <div class="badge badge-outline gap-2">
                                            {skill.name}
                                            <div class="badge badge-ghost badge-sm">{skill.count.toLocaleString()}</div>
                                        </div>
                                    {/each}
                                {:else}
                                    <p class="text-sm text-base-content/50">No skills found in resume.</p>
                                {/if}
                            </div>
                        </div>
                        
                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md text-success mb-3">Market Skills You Have ({analysisResult.gap_analysis.total_matching_skills})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each analysisResult.gap_analysis.matching_skills as skill}
                                    <div class="badge badge-success gap-2">
                                        {skill.name}
                                        <div class="badge badge-ghost badge-sm">{skill.count.toLocaleString()}</div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md text-error mb-3">Your Top Skill Gaps ({analysisResult.gap_analysis.missing_skills.slice(0, missingSkillsLimit).length} of {analysisResult.gap_analysis.total_missing_skills})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each analysisResult.gap_analysis.missing_skills.slice(0, missingSkillsLimit) as skill}
                                    <div class="badge badge-error gap-2">
                                        {skill.name}
                                        <div class="badge badge-ghost badge-sm">{skill.count.toLocaleString()}</div>
                                    </div>
                                {/each}
                            </div>
                            {#if analysisResult.gap_analysis.total_missing_skills > missingSkillsLimit}
                                <button class="btn btn-link btn-xs p-0 mt-2" on:click={() => missingSkillsLimit += 10}>Show 10 More</button>
                            {/if}
                        </div>

                        <!-- Tools Row -->
                        <div class="md:col-span-3 flex items-center gap-3 font-bold text-lg text-primary pt-4 border-t border-base-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                            <span>Tools Analysis</span>
                        </div>
                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md mb-3">Your Tools ({analysisResult.gap_analysis.total_user_tools})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#if analysisResult.gap_analysis.user_tools.length > 0}
                                    {#each analysisResult.gap_analysis.user_tools as tool}
                                        <div class="badge badge-outline gap-2">
                                            {tool.name}
                                            <div class="badge badge-ghost badge-sm">{tool.count.toLocaleString()}</div>
                                        </div>
                                    {/each}
                                {:else}
                                    <p class="text-sm text-base-content/50">No tools found in resume.</p>
                                {/if}
                            </div>
                        </div>
                        
                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md text-success mb-3">Market Tools You Have ({analysisResult.gap_analysis.total_matching_tools})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each analysisResult.gap_analysis.matching_tools as tool}
                                    <div class="badge badge-success gap-2">
                                        {tool.name}
                                        <div class="badge badge-ghost badge-sm">{tool.count.toLocaleString()}</div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <div class="bg-base-200/30 p-4 rounded-lg">
                            <h3 class="font-semibold text-md text-error mb-3">Your Top Tool Gaps ({analysisResult.gap_analysis.missing_tools.slice(0, missingToolsLimit).length} of {analysisResult.gap_analysis.total_missing_tools})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each analysisResult.gap_analysis.missing_tools.slice(0, missingToolsLimit) as tool}
                                    <div class="badge badge-error gap-2">
                                        {tool.name}
                                        <div class="badge badge-ghost badge-sm">{tool.count.toLocaleString()}</div>
                                    </div>
                                {/each}
                            </div>
                                {#if analysisResult.gap_analysis.total_missing_tools > missingToolsLimit}
                                <button class="btn btn-link btn-xs p-0 mt-2" on:click={() => missingToolsLimit += 10}>Show 10 More</button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="collapse collapse-arrow bg-base-100 border border-base-300 shadow-lg hover:shadow-2xl transition-shadow">
                <input type="radio" name="result-accordion" />
                <div class="collapse-title text-2xl font-medium">
                    Build on Your Strengths (Recommended Next Skills)
                </div>
                <div class="collapse-content">
                    <p class="text-base-content/70 mb-4">These suggestions are based on skills and tools that frequently appear together in job postings for the <span class="font-bold text-primary">{selectedRole}</span> market. Learning them can complement your existing expertise.</p>
                    
                    <div class="space-y-3 mt-4">
                        {#if Object.keys(analysisResult.recommendations.based_on_your_strengths).length > 0}
                            {#each Object.entries(analysisResult.recommendations.based_on_your_strengths) as [userSkill, suggestedSkills]}
                                <div class="p-3 rounded-lg bg-base-200/50 border border-base-300 text-sm">
                                    <p class="text-base-content/80">
                                        Because you know <span class="font-bold text-primary">{userSkill}</span>, consider learning:
                                    </p>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        {#each suggestedSkills as suggested}
                                            <div class="badge badge-outline font-semibold">{suggested}</div>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <p class="text-sm text-base-content/50 italic">No specific co-occurrence suggestions available for your skill set in this market.</p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
{/if}
</div>