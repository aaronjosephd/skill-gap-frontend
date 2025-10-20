export interface SkillCount {
    skill: string;
    count: number;
}

export interface ToolCount {
    tool: string;
    count: number;
}

export interface RoleSkill {
    cmo_role_match: string;
    skill: string;
    count: number;
}

export interface RoleTool {
    cmo_role_match: string;
    tool: string;
    count: number;
}

export interface ExperienceDistribution {
    year: number;
    count: number;
}

export interface SkillCooccurrence {
    skill_A: string;
    skill_B: string;
    count: number;
}

export interface ToolCooccurrence {
    tool_A: string;
    tool_B: string;
    count: number;
}

export interface JobRoleDistribution {
    cmo_role_match: string;
    count: number;
}

export interface MarketInsightsResponse {
    top_overall_skills: SkillCount[];
    total_overall_skills: number;
    top_overall_tools: ToolCount[];
    total_overall_tools: number;
    experience_distribution: ExperienceDistribution[];
    total_experience_distribution: number;
    skill_co_occurrence: SkillCooccurrence[];
    total_skill_co_occurrence: number;
    tool_co_occurrence: ToolCooccurrence[];
    total_tool_co_occurrence: number;
    average_experience?: number;
}

export interface RoleInsightsResponse {
    top_skills: RoleSkill[];
    total_skills: number;
    top_tools: RoleTool[];
    total_tools: number;
    average_experience: number | null;
    experience_distribution: ExperienceDistribution[];
    total_experience_distribution: number;
    skill_co_occurrence: SkillCooccurrence[];
    total_skill_co_occurrence: number;
    tool_co_occurrence: ToolCooccurrence[];
    total_tool_co_occurrence: number;
}

export interface SimilarJob {
    job_title: string;
    similarity_score: number;
    cmo_role_match: string;
    url?: string;
}

export interface SkillDetail {
    name: string;
    count: number;
}

export interface GapAnalysis {
    user_skills: SkillDetail[];
    user_tools: SkillDetail[];
    missing_skills: SkillDetail[];
    matching_skills: SkillDetail[];
    missing_tools: SkillDetail[];
    matching_tools: SkillDetail[];
    total_user_skills: number;
    total_user_tools: number;
    total_missing_skills: number;
    total_matching_skills: number;
    total_missing_tools: number;
    total_matching_tools: number;
}

export interface AnalysisResult {
    similar_jobs: SimilarJob[];
    total_similar_jobs: number;
    gap_analysis: GapAnalysis;
    recommendations: {
        message: string;
        skills_to_learn: SkillDetail[];
        tools_to_learn: SkillDetail[];
        based_on_your_strengths: Record<string, string[]>;
    };
    session_id: string;
