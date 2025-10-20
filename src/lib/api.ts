import type { MarketInsightsResponse, RoleInsightsResponse, AnalysisResult, JobRoleDistribution, SimilarJob } from './types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorBody.detail || 'An unknown error occurred');
    }
    return response.json();
}

export async function getMarketInsights(page: number = 1, limit: number = 20): Promise<MarketInsightsResponse> {
    const response = await fetch(`${API_BASE_URL}/market_insights?page=${page}&limit=${limit}`);
    return handleResponse<MarketInsightsResponse>(response);
}

export async function getRoles(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/roles`);
    return handleResponse<string[]>(response);
}

export async function getRoleInsights(role: string, page: number = 1, limit: number = 10): Promise<RoleInsightsResponse> {
    const response = await fetch(`${API_BASE_URL}/market_insights/${encodeURIComponent(role)}?page=${page}&limit=${limit}`);
    return handleResponse<RoleInsightsResponse>(response);
}

export async function analyzeResume(formData: FormData, limit: number = 10): Promise<AnalysisResult> {
    formData.append('limit', limit.toString());
    const response = await fetch(`${API_BASE_URL}/analyze_resume`, {
        method: 'POST',
        body: formData
    });
    return handleResponse<AnalysisResult>(response);
}

export async function getJobRoleDistribution(): Promise<JobRoleDistribution[]> {
    const response = await fetch(`${API_BASE_URL}/job_roles_distribution`);
    return handleResponse<JobRoleDistribution[]>(response);
}

export async function getMoreSimilarJobs(sessionId: string, page: number): Promise<SimilarJob[]> {
    const response = await fetch(`${API_BASE_URL}/similar_jobs/${sessionId}?page=${page}&limit=10`);
    return handleResponse<SimilarJob[]>(response);
}
