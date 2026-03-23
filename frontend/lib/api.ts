const getApiBase = () => {
    if (typeof window !== "undefined") {
        return `${window.location.protocol}//${window.location.hostname}:8080/api`;
    }
    return "http://localhost:8080/api";
};
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || getApiBase();

export async function fetchDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/overview`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch dashboard:", error);
        return null;
    }
}

export async function fetchActivityFeed() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/activity`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch activity:", error);
        return null;
    }
}

export async function fetchInsights() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/insights`);
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch insights:", error);
        return null;
    }
}

export async function fetchPipelines() {
    try {
        const res = await fetch(`${API_BASE}/pipeline/list`);
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch pipelines:", error);
        return [];
    }
}

export async function triggerPipeline() {
    const res = await fetch(`${API_BASE}/pipeline/trigger?project_id=main`, { method: 'POST' });
    return res.json();
}

export async function applyPatch(pipelineId: string, failureLog: string, repo: string, branch: string) {
    const res = await fetch(`${API_BASE}/pipeline/apply-patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_id: pipelineId, failure_log: failureLog, repo, branch })
    });
    return res.json();
}

export async function cancelPipeline(pipelineId: string) {
    const res = await fetch(`${API_BASE}/pipeline/cancel?pipeline_id=${pipelineId}`, { method: 'POST' });
    return res.json();
}

export async function fetchProfile() {
    try {
        const res = await fetch(`${API_BASE}/settings/profile`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchProfile", e);
        return null;
    }
}
export async function updateProfile(data: any) {
    const res = await fetch(`${API_BASE}/settings/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return res.json();
}

export async function updateSecurity(data: any) {
    const res = await fetch(`${API_BASE}/settings/security`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update security");
    return res.json();
}

export async function fetchApiKeys() {
    try {
        const res = await fetch(`${API_BASE}/settings/api-keys`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchApiKeys", e);
        return [];
    }
}
export async function createApiKey(name: string) {
    const res = await fetch(`${API_BASE}/settings/api-keys`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
    });
    return res.json();
}
export async function revokeApiKey(id: string) {
    const res = await fetch(`${API_BASE}/settings/api-keys/${id}`, { method: 'DELETE' });
    return res.json();
}

export async function fetchIntegrations() {
    try {
        const res = await fetch(`${API_BASE}/settings/integrations`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchIntegrations", e);
        return [];
    }
}
export async function addIntegration(provider: string, token: string) {
    const res = await fetch(`${API_BASE}/settings/integrations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, token })
    });
    return res.json();
}
export async function rmdIntegration(provider: string) {
    const res = await fetch(`${API_BASE}/settings/integrations/${provider}`, { method: 'DELETE' });
    return res.json();
}

export async function fetchPreferences() {
    try {
        const res = await fetch(`${API_BASE}/settings/preferences`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchPreferences", e);
        return null;
    }
}
export async function updatePreferences(data: any) {
    const res = await fetch(`${API_BASE}/settings/preferences`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return res.json();
}

export async function fetchFullDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/full-overview`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchFullDashboard", e);
        return null;
    }
}

export async function fetchCloudHistory() {
    try {
        const res = await fetch(`${API_BASE}/cloud/history`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchCloudHistory", e);
        return [];
    }
}

export async function fetchSecurityHistory() {
    try {
        const res = await fetch(`${API_BASE}/security/history`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchSecurityHistory", e);
        return [];
    }
}

export async function fetchGreenCarbon(durationSeconds: number = 600) {
    try {
        const res = await fetch(`${API_BASE}/green/carbon?duration_seconds=${durationSeconds}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchGreenCarbon", e);
        return null;
    }
}

export async function reapGreenZombies(idleDays: number = 7) {
    try {
        const res = await fetch(`${API_BASE}/green/zombie/reap?idle_days=${idleDays}`, { method: 'POST' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Fetch err reapGreenZombies", e);
        return null;
    }
}

export async function fetchOnboardingStatus() {
    try {
        const res = await fetch(`${API_BASE}/onboarding/status`);
        if (!res.ok) return { completed: false };
        return await res.json();
    } catch (e) {
        console.error("Fetch err fetchOnboardingStatus", e);
        return { completed: false };
    }
}

export async function completeOnboarding() {
    try {
        const res = await fetch(`${API_BASE}/onboarding/complete`, { method: 'POST' });
        if (!res.ok) return { status: 'error' };
        return await res.json();
    } catch (e) {
        console.error("Fetch err completeOnboarding", e);
        return { status: 'error' };
    }
}

export async function resolveSimulation(status: string) {
    try {
        const res = await fetch(`${API_BASE}/pipeline/resolve-simulations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}
