<script lang="ts">
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import { getMarketInsights, getRoles, getRoleInsights, getJobRoleDistribution } from '$lib/api';
    import type { MarketInsightsResponse, RoleInsightsResponse, JobRoleDistribution } from '$lib/types';
    import { selectedMarketRole } from '$lib/stores';
    import BarChart from '$lib/components/BarChart.svelte';
    import InsightCard from '$lib/components/InsightCard.svelte';
    import AnimatedRadialYears from '$lib/components/AnimatedRadialYears.svelte';
    import type { ChartData, ChartOptions } from 'chart.js';

    let overallInsights: MarketInsightsResponse | null = null;
    let roleInsights: RoleInsightsResponse | null = null;
    let jobRoleDistribution: JobRoleDistribution[] = [];
    let roles: string[] = [];
    let error: string | null = null;
    let isLoadingRoleData = false;

    let top_overall_skills: MarketInsightsResponse['top_overall_skills'] = [];
    let top_overall_tools: MarketInsightsResponse['top_overall_tools'] = [];
    let skill_co_occurrence: MarketInsightsResponse['skill_co_occurrence'] = [];
    let tool_co_occurrence: MarketInsightsResponse['tool_co_occurrence'] = [];
    let experience_distribution: MarketInsightsResponse['experience_distribution'] = [];
    let average_experience: MarketInsightsResponse['average_experience'] = null;


    let role_top_skills: RoleInsightsResponse['top_skills'] = [];
    let role_top_tools: RoleInsightsResponse['top_tools'] = [];
    let role_skill_co_occurrence: RoleInsightsResponse['skill_co_occurrence'] = [];
    let role_tool_co_occurrence: RoleInsightsResponse['tool_co_occurrence'] = [];
    let role_experience_distribution: RoleInsightsResponse['experience_distribution'] = [];
    let role_average_experience: RoleInsightsResponse['average_experience'] = null;

    // --- Pagination State ---
    const limit = 10; // Items per page
    let overallSkillsPage = 1;
    let overallToolsPage = 1;
    let skillCoPage = 1;
    let toolCoPage = 1;
    let overallExpPage = 1;

    let roleSkillsPage = 1;
    let roleToolsPage = 1;
    let roleSkillCoPage = 1;
    let roleToolCoPage = 1;
    let roleExpPage = 1;

    // --- Chart Data ---
    let overallSkillsData: ChartData<'bar'>;
    let overallToolsData: ChartData<'bar'>;
    let experienceDistributionData: ChartData<'bar'>;
    let roleSkillsData: ChartData<'bar'>;
    let roleToolsData: ChartData<'bar'>;
    let roleExperienceDistributionData: ChartData<'bar'>;

    let totalOverallPostings = 0;
    $: totalOverallPostings = jobRoleDistribution.reduce((sum, role) => sum + role.count, 0);

    const commonChartOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { beginAtZero: true },
            y: { ticks: { autoSkip: false } }
        },
        plugins: {
            legend: { display: false },
        }
    };

    $: genericTooltipOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.label}: ${context.raw}`
                }
            }
        }
    };

    $: overallSkillsOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const count = context.raw;
                        if (totalOverallPostings === 0) return `${context.label}: ${count}`;
                        const percentage = ((count / totalOverallPostings) * 100).toFixed(1);
                        return `${context.label}: ${count} (${percentage}% of all postings)`;
                    }
                }
            }
        }
    };

    $: overallToolsOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const count = context.raw;
                        if (totalOverallPostings === 0) return `${context.label}: ${count}`;
                        const percentage = ((count / totalOverallPostings) * 100).toFixed(1);
                        return `${context.label}: ${count} (${percentage}% of all postings)`;
                    }
                }
            }
        }
    };

    $: roleSkillsOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const totalRolePostings = jobRoleDistribution.find(r => r.cmo_role_match === $selectedMarketRole)?.count || 0;
                        const count = context.raw;
                        if (totalRolePostings === 0) return `${context.label}: ${count}`;
                        const percentage = ((count / totalRolePostings) * 100).toFixed(1);
                        return `${context.label}: ${count} (${percentage}% of role postings)`;
                    }
                }
            }
        }
    };

    $: roleToolsOptions = {
        ...commonChartOptions,
        plugins: {
            ...commonChartOptions.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const totalRolePostings = jobRoleDistribution.find(r => r.cmo_role_match === $selectedMarketRole)?.count || 0;
                        const count = context.raw;
                        if (totalRolePostings === 0) return `${context.label}: ${count}`;
                        const percentage = ((count / totalRolePostings) * 100).toFixed(1);
                        return `${context.label}: ${count} (${percentage}% of role postings)`;
                    }
                }
            }
        }
    };

    // --- Data Fetching ---
    onMount(async () => {
        try {
            const [insights, fetchedRoles, distribution] = await Promise.all([
                getMarketInsights(1, limit),
                getRoles(),
                getJobRoleDistribution()
            ]);
            overallInsights = insights;
            top_overall_skills = insights.top_overall_skills;
            top_overall_tools = insights.top_overall_tools;
            skill_co_occurrence = insights.skill_co_occurrence;
            tool_co_occurrence = insights.tool_co_occurrence;
            experience_distribution = insights.experience_distribution;
            average_experience = insights.average_experience;
            roles = fetchedRoles;
            jobRoleDistribution = distribution;
        } catch (e: any) {
            error = e.message;
        }
    });

    async function handleRoleChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedMarketRole.set(target.value);

        if (target.value === 'Overall Market') {
            roleInsights = null;
            return;
        }

        isLoadingRoleData = true;
        error = null;
        // Reset page counts when role changes
        roleSkillsPage = 1;
        roleToolsPage = 1;
        roleSkillCoPage = 1;
        roleToolCoPage = 1;
        roleExpPage = 1;

        try {
            const insights = await getRoleInsights(target.value, 1, limit);
            roleInsights = insights;
            role_top_skills = insights.top_skills;
            role_top_tools = insights.top_tools;
            role_skill_co_occurrence = insights.skill_co_occurrence;
            role_tool_co_occurrence = insights.tool_co_occurrence;
            role_experience_distribution = insights.experience_distribution;
            role_average_experience = insights.average_experience;
        } catch (e: any) {
            error = e.message;
        } finally {
            isLoadingRoleData = false;
        }
    }

    async function fetchOverallDataPage(dataType: 'skills' | 'tools' | 'skill_co' | 'tool_co' | 'experience', page: number) {
        try {
            const newInsights = await getMarketInsights(page, limit);
            if (dataType === 'skills') {
                top_overall_skills = newInsights.top_overall_skills;
                overallSkillsPage = page;
            } else if (dataType === 'tools') {
                top_overall_tools = newInsights.top_overall_tools;
                overallToolsPage = page;
            } else if (dataType === 'skill_co') {
                skill_co_occurrence = newInsights.skill_co_occurrence;
                skillCoPage = page;
            } else if (dataType === 'tool_co') {
                tool_co_occurrence = newInsights.tool_co_occurrence;
                toolCoPage = page;
            } else if (dataType === 'experience') {
                experience_distribution = newInsights.experience_distribution;
                overallExpPage = page;
            }
        } catch (e: any) {
            error = e.message;
        }
    }

    async function fetchRoleDataPage(role: string, dataType: 'skills' | 'tools' | 'skill_co' | 'tool_co' | 'experience', page: number) {
        try {
            const newInsights = await getRoleInsights(role, page, limit);
            if (dataType === 'skills') {
                role_top_skills = newInsights.top_skills;
                roleSkillsPage = page;
            } else if (dataType === 'tools') {
                role_top_tools = newInsights.top_tools;
                roleToolsPage = page;
            } else if (dataType === 'skill_co') {
                role_skill_co_occurrence = newInsights.skill_co_occurrence;
                roleSkillCoPage = page;
            } else if (dataType === 'tool_co') {
                role_tool_co_occurrence = newInsights.tool_co_occurrence;
                roleToolCoPage = page;
            } else if (dataType === 'experience') {
                role_experience_distribution = newInsights.experience_distribution;
                roleExpPage = page;
            }
        } catch (e: any) {
            error = e.message;
        }
    }

    // --- Reactive Chart Updates ---
    $: overallSkillsData = {
        labels: top_overall_skills.map(s => s.skill),
        datasets: [{
            label: 'Count',
            data: top_overall_skills.map(s => s.count),
            backgroundColor: '#570df8'
        }]
    };
    $: overallToolsData = {
        labels: top_overall_tools.map(t => t.tool),
        datasets: [{
            label: 'Count',
            data: top_overall_tools.map(t => t.count),
            backgroundColor: '#f000b8'
        }]
    };
    $: experienceDistributionData = {
        labels: experience_distribution.map(e => e.year === 1 ? `${e.year} year` : `${e.year} years`),
        datasets: [{
            label: 'Count',
            data: experience_distribution.map(e => e.count),
            backgroundColor: '#36d399'
        }]
    };

    $: roleSkillsData = {
        labels: role_top_skills.map(s => s.skill),
        datasets: [{
            label: 'Count',
            data: role_top_skills.map(s => s.count),
            backgroundColor: '#570df8'
        }]
    };
    $: roleToolsData = {
        labels: role_top_tools.map(t => t.tool),
        datasets: [{
            label: 'Count',
            data: role_top_tools.map(t => t.count),
            backgroundColor: '#f000b8'
        }]
    };
    $: roleExperienceDistributionData = {
        labels: role_experience_distribution.map(e => e.year === 1 ? `${e.year} year` : `${e.year} years`),
        datasets: [{
            label: 'Count',
            data: role_experience_distribution.map(e => e.count),
            backgroundColor: '#36d399'
        }]
    };
</script>

<svelte:head>
    <title>Market Insights - Skill Gap</title>
</svelte:head>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="text-center mb-16">
        <h1 class="text-5xl md:text-6xl font-extrabold mb-2">Job Market Insights</h1>
        <p class="text-lg md:text-xl text-base-content/70">An overview of the most in-demand skills and technologies.</p>
    </div>

    <div class="form-control max-w-md mx-auto mb-16">
        <label for="role-select" class="label">
            <span class="label-text">Filter by Job Category</span>
        </label>
        <select id="role-select" class="select select-bordered" on:change={handleRoleChange}>
            {#each roles as role}
                <option value={role} selected={role === $selectedMarketRole}>{role}</option>
            {/each}
        </select>
    </div>

    {#if error}
        <div class="alert alert-error max-w-4xl mx-auto">
            <span>Error: {error}</span>
        </div>
    {/if}

    <!-- Role-Specific View -->
    {#if $selectedMarketRole && $selectedMarketRole !== 'Overall Market'}
        {#if isLoadingRoleData}
            <div class="text-center">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        {:else if roleInsights}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <InsightCard title="Average Experience" delay={150} cardClass="bg-gradient-to-br from-base-100 to-base-300">
                    <div slot="content" class="flex flex-col items-center justify-center h-full text-center">
                        {#if role_average_experience}
                            <div title="The average years of experience required for the {$selectedMarketRole} role.">
                                <AnimatedRadialYears value={role_average_experience} />
                                <p class="text-base-content/70 mt-2">years</p>
                            </div>
                        {:else}
                            <div class="flex items-center justify-center h-full">
                                <p class="text-base-content/60">Not available</p>
                            </div>
                        {/if}
                    </div>
                </InsightCard>
                <InsightCard title="Experience Requirement Distribution" delay={175}>
                    <div slot="content">
                        <div class="overflow-x-auto"><BarChart data={roleExperienceDistributionData} options={{...genericTooltipOptions, indexAxis: 'x'}} /></div>
                    </div>
                    <div slot="footer" class="join grid grid-cols-2">
                        <button class="join-item btn btn-outline" disabled={roleExpPage === 1} on:click={() => fetchRoleDataPage($selectedMarketRole, 'experience', roleExpPage - 1)}>Previous</button>
                        <button class="join-item btn btn-outline" disabled={!roleInsights || roleExpPage * limit >= roleInsights.total_experience_distribution} on:click={() => fetchRoleDataPage($selectedMarketRole, 'experience', roleExpPage + 1)}>Next</button>
                    </div>
                </InsightCard>
                <InsightCard title="Top Skills for {$selectedMarketRole}" delay={0}>
                    <div slot="content">
                        <div class="overflow-x-auto"><BarChart data={roleSkillsData} options={roleSkillsOptions} /></div>
                    </div>
                    <div slot="footer" class="join grid grid-cols-2">
                        <button class="join-item btn btn-outline" disabled={roleSkillsPage === 1} on:click={() => fetchRoleDataPage($selectedMarketRole, 'skills', roleSkillsPage - 1)}>Previous</button>
                        <button class="join-item btn btn-outline" disabled={!roleInsights || roleSkillsPage * limit >= roleInsights.total_skills} on:click={() => fetchRoleDataPage($selectedMarketRole, 'skills', roleSkillsPage + 1)}>Next</button>
                    </div>
                </InsightCard>
                <InsightCard title="Top Tools for {$selectedMarketRole}" delay={100}>
                    <div slot="content">
                        <div class="overflow-x-auto"><BarChart data={roleToolsData} options={roleToolsOptions} /></div>
                    </div>
                    <div slot="footer" class="join grid grid-cols-2">
                        <button class="join-item btn btn-outline" disabled={roleToolsPage === 1} on:click={() => fetchRoleDataPage($selectedMarketRole, 'tools', roleToolsPage - 1)}>Previous</button>
                        <button class="join-item btn btn-outline" disabled={!roleInsights || roleToolsPage * limit >= roleInsights.total_tools} on:click={() => fetchRoleDataPage($selectedMarketRole, 'tools', roleToolsPage + 1)}>Next</button>
                    </div>
                </InsightCard>
                <InsightCard title="Skill Co-occurrence for {$selectedMarketRole}" delay={200}>
                    <div slot="content">
                        {#if role_skill_co_occurrence.length > 0}
                            <div class="space-y-2">
                                {#each role_skill_co_occurrence as item, i}
                                    <div class="flex items-center justify-between p-2 rounded-lg {i % 2 === 0 ? 'bg-base-200/50' : ''}">
                                        <div class="flex items-center gap-2 text-sm">
                                            <span class="font-semibold">{item.skill_A}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                                            <span class="font-semibold">{item.skill_B}</span>
                                        </div>
                                        <div class="badge badge-neutral">{item.count}</div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="flex items-center justify-center h-full">
                                <p class="text-base-content/60">No co-occurrence data available for this role.</p>
                            </div>
                        {/if}
                    </div>
                    <div slot="footer" class="join grid grid-cols-2">
                        <button class="join-item btn btn-outline" disabled={roleSkillCoPage === 1} on:click={() => fetchRoleDataPage($selectedMarketRole, 'skill_co', roleSkillCoPage - 1)}>Previous</button>
                        <button class="join-item btn btn-outline" disabled={!roleInsights || roleSkillCoPage * limit >= roleInsights.total_skill_co_occurrence} on:click={() => fetchRoleDataPage($selectedMarketRole, 'skill_co', roleSkillCoPage + 1)}>Next</button>
                    </div>
                </InsightCard>
                <InsightCard title="Tool Co-occurrence for {$selectedMarketRole}" delay={300}>
                    <div slot="content">
                        {#if role_tool_co_occurrence.length > 0}
                            <div class="space-y-2">
                                {#each role_tool_co_occurrence as item, i}
                                    <div class="flex items-center justify-between p-2 rounded-lg {i % 2 === 0 ? 'bg-base-200/50' : ''}">
                                        <div class="flex items-center gap-2 text-sm">
                                            <span class="font-semibold">{item.tool_A}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                                            <span class="font-semibold">{item.tool_B}</span>
                                        </div>
                                        <div class="badge badge-neutral">{item.count}</div>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="flex items-center justify-center h-full">
                                <p class="text-base-content/60">No co-occurrence data available for this role.</p>
                            </div>
                        {/if}
                    </div>
                    <div slot="footer" class="join grid grid-cols-2">
                        <button class="join-item btn btn-outline" disabled={roleToolCoPage === 1} on:click={() => fetchRoleDataPage($selectedMarketRole, 'tool_co', roleToolCoPage - 1)}>Previous</button>
                        <button class="join-item btn btn-outline" disabled={!roleInsights || roleToolCoPage * limit >= roleInsights.total_tool_co_occurrence} on:click={() => fetchRoleDataPage($selectedMarketRole, 'tool_co', roleToolCoPage + 1)}>Next</button>
                    </div>
                </InsightCard>
            </div>
        {/if}
    {:else if overallInsights}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <InsightCard title="Job Postings by Category" delay={0} cardClass="lg:col-span-2">
                <div slot="content" class="overflow-x-auto">
                    <table class="table table-zebra table-pin-rows">
                        <thead><tr><th>Category</th><th>Postings</th></tr></thead>
                        <tbody>
                            {#each jobRoleDistribution as item}
                                <tr class="hover"><td>{item.cmo_role_match}</td><td>{item.count}</td></tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </InsightCard>
            <InsightCard title="Overall Average Experience" delay={100} cardClass="bg-gradient-to-br from-base-100 to-base-300">
                <div slot="content" class="flex flex-col items-center justify-center h-full text-center">
                    {#if average_experience}
                        <div title="This is the average years of experience required across all {roles.length - 1} job roles analyzed.">
                            <AnimatedRadialYears value={average_experience} />
                            <p class="text-base-content/70 mt-2">years</p>
                        </div>
                    {:else}
                        <div class="flex items-center justify-center h-full">
                            <p class="text-base-content/60">Not available</p>
                        </div>
                    {/if}
                </div>
            </InsightCard>
            <InsightCard title="Experience Requirement Distribution" delay={150}>
                <div slot="content">
                    <div class="overflow-x-auto"><BarChart data={experienceDistributionData} options={{...genericTooltipOptions, indexAxis: 'x'}} /></div>
                </div>
                <div slot="footer" class="join grid grid-cols-2">
                    <button class="join-item btn btn-outline" disabled={overallExpPage === 1} on:click={() => fetchOverallDataPage('experience', overallExpPage - 1)}>Previous</button>
                    <button class="join-item btn btn-outline" disabled={!overallInsights || overallExpPage * limit >= overallInsights.total_experience_distribution} on:click={() => fetchOverallDataPage('experience', overallExpPage + 1)}>Next</button>
                </div>
            </InsightCard>
            <InsightCard title="Top Overall Skills" delay={200}>
                <div slot="content">
                    <div class="overflow-x-auto"><BarChart data={overallSkillsData} options={overallSkillsOptions} /></div>
                </div>
                <div slot="footer" class="join grid grid-cols-2">
                    <button class="join-item btn btn-outline" disabled={overallSkillsPage === 1} on:click={() => fetchOverallDataPage('skills', overallSkillsPage - 1)}>Previous</button>
                    <button class="join-item btn btn-outline" disabled={!overallInsights || overallSkillsPage * limit >= overallInsights.total_overall_skills} on:click={() => fetchOverallDataPage('skills', overallSkillsPage + 1)}>Next</button>
                </div>
            </InsightCard>
            <InsightCard title="Top Overall Tools" delay={250}>
                <div slot="content">
                    <div class="overflow-x-auto"><BarChart data={overallToolsData} options={overallToolsOptions} /></div>
                </div>
                <div slot="footer" class="join grid grid-cols-2">
                    <button class="join-item btn btn-outline" disabled={overallToolsPage === 1} on:click={() => fetchOverallDataPage('tools', overallToolsPage - 1)}>Previous</button>
                    <button class="join-item btn btn-outline" disabled={!overallInsights || overallToolsPage * limit >= overallInsights.total_overall_tools} on:click={() => fetchOverallDataPage('tools', overallToolsPage + 1)}>Next</button>
                </div>
            </InsightCard>
            <InsightCard title="Overall Skill Co-occurrence" delay={300}>
                <div slot="content">
                    {#if skill_co_occurrence.length > 0}
                        <div class="space-y-2">
                            {#each skill_co_occurrence as item, i}
                                <div class="flex items-center justify-between p-2 rounded-lg {i % 2 === 0 ? 'bg-base-200/50' : ''}">
                                    <div class="flex items-center gap-2 text-sm">
                                        <span class="font-semibold">{item.skill_A}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                                        <span class="font-semibold">{item.skill_B}</span>
                                    </div>
                                    <div class="badge badge-neutral">{item.count}</div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="flex items-center justify-center h-full">
                            <p class="text-base-content/60">No co-occurrence data available.</p>
                        </div>
                    {/if}
                </div>
                <div slot="footer" class="join grid grid-cols-2">
                    <button class="join-item btn btn-outline" disabled={skillCoPage === 1} on:click={() => fetchOverallDataPage('skill_co', skillCoPage - 1)}>Previous</button>
                    <button class="join-item btn btn-outline" disabled={!overallInsights || skillCoPage * limit >= overallInsights.total_skill_co_occurrence} on:click={() => fetchOverallDataPage('skill_co', skillCoPage + 1)}>Next</button>
                </div>
            </InsightCard>
            <InsightCard title="Overall Tool Co-occurrence" delay={350}>
                <div slot="content">
                    {#if tool_co_occurrence.length > 0}
                        <div class="space-y-2">
                            {#each tool_co_occurrence as item, i}
                                <div class="flex items-center justify-between p-2 rounded-lg {i % 2 === 0 ? 'bg-base-200/50' : ''}">
                                    <div class="flex items-center gap-2 text-sm">
                                        <span class="font-semibold">{item.tool_A}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
                                        <span class="font-semibold">{item.tool_B}</span>
                                    </div>
                                    <div class="badge badge-neutral">{item.count}</div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="flex items-center justify-center h-full">
                            <p class="text-base-content/60">No co-occurrence data available.</p>
                        </div>
                    {/if}
                </div>
                <div slot="footer" class="join grid grid-cols-2">
                    <button class="join-item btn btn-outline" disabled={toolCoPage === 1} on:click={() => fetchOverallDataPage('tool_co', toolCoPage - 1)}>Previous</button>
                    <button class="join-item btn btn-outline" disabled={!overallInsights || toolCoPage * limit >= overallInsights.total_tool_co_occurrence} on:click={() => fetchOverallDataPage('tool_co', toolCoPage + 1)}>Next</button>
                </div>
            </InsightCard>
        </div>
    {:else}
        <!-- Initial Loading Skeleton -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {#each Array(4) as _}
                <div class="skeleton h-96 w-full"></div>
            {/each}
        </div>
    {/if}
</div>
