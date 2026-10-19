/**
 * 后端 API 客户端（前端唯一的数据出入口）。
 *
 * 身份通过请求头模拟（原型阶段无登录）：
 *   X-User-Id: 当前用户球员ID（默认 "p1" = 张伟，南宁联队队长）
 *   X-User-Role: member / captain / association / visitor
 *
 * 所有函数返回后端 snake_case 原始 JSON；类型映射见 src/lib/mappers.ts。
 */
const API_BASE = "http://localhost:8010/api";
const DEFAULT_USER_ID = "p1";
const DEFAULT_ROLE = "member";

export interface ApiOptions {
  userId?: string;
  role?: "member" | "captain" | "association" | "visitor";
}

function headers(options: ApiOptions = {}): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-User-Id": options.userId ?? DEFAULT_USER_ID,
    "X-User-Role": options.role ?? DEFAULT_ROLE,
  };
}

async function request<T>(path: string, options: ApiOptions = {}, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers(options), ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.detail ?? "";
    } catch {
      detail = await response.text();
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

function toQuery(params?: Record<string, string>): string {
  if (!params) return "";
  const search = new URLSearchParams(params);
  const text = search.toString();
  return text ? `?${text}` : "";
}

// ---------- 赛程 / 积分榜 ----------
export const fetchMatches = (params?: Record<string, string>, options?: ApiOptions) =>
  request<unknown[]>(`/matches${toQuery(params)}`, options);

export const fetchMatch = (matchId: string, options?: ApiOptions) =>
  request<unknown>(`/matches/${matchId}`, options);

export const updateMatch = (matchId: string, payload: Record<string, unknown>, options?: ApiOptions) =>
  request(`/matches/${matchId}`, options, { method: "PATCH", body: JSON.stringify(payload) });

export const createMatches = (items: Record<string, unknown>[], options?: ApiOptions) =>
  request(`/matches`, options, { method: "POST", body: JSON.stringify(items) });

export const enterMatchResult = (matchId: string, payload: Record<string, unknown>, options?: ApiOptions) =>
  request(`/matches/${matchId}/result`, options, { method: "POST", body: JSON.stringify(payload) });

export const fetchStandings = (group?: string, options?: ApiOptions) =>
  request<unknown[]>(`/standings${toQuery(group ? { group } : undefined)}`, options);

// ---------- 球队 / 球员 ----------
export const fetchTeams = (options?: ApiOptions) => request<unknown[]>("/teams", options);

export const fetchPlayers = (teamId?: string, options?: ApiOptions) =>
  request<unknown[]>(`/players${toQuery(teamId ? { team_id: teamId } : undefined)}`, options);

export const updateHealth = (playerId: string, healthStatus: string, options?: ApiOptions) =>
  request(`/players/${playerId}/health`, options, {
    method: "PATCH",
    body: JSON.stringify({ health_status: healthStatus }),
  });

export const updateTraits = (playerId: string, personalTraits: string[], options?: ApiOptions) =>
  request(`/players/${playerId}/traits`, options, {
    method: "PUT",
    body: JSON.stringify({ personal_traits: personalTraits }),
  });

// ---------- 阵容 ----------
export const fetchLineup = (matchId: string, teamId: string, options?: ApiOptions) =>
  request(`/lineups?match_id=${matchId}&team_id=${teamId}`, options);

export const saveLineup = (payload: Record<string, unknown>, options?: ApiOptions) =>
  request(`/lineups`, options, { method: "PUT", body: JSON.stringify(payload) });

export const publishLineup = (lineupId: string, options?: ApiOptions) =>
  request(`/lineups/${lineupId}/publish`, options, { method: "POST" });

export const recommendLineup = (payload: Record<string, unknown>, options?: ApiOptions) =>
  request<unknown>(`/lineups/recommend`, options, { method: "POST", body: JSON.stringify(payload) });

// ---------- 感想 / 文稿 / 约球 / 消息 ----------
export const fetchReviews = (matchId: string, options?: ApiOptions) =>
  request<unknown[]>(`/matches/${matchId}/reviews`, options);

export const submitReview = (matchId: string, content: string, options?: ApiOptions) =>
  request(`/matches/${matchId}/reviews`, options, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const fetchReviewSummary = (matchId: string, options?: ApiOptions) =>
  request(`/matches/${matchId}/review-summary`, options);

export const fetchArticles = (options?: ApiOptions) => request<unknown[]>("/articles", options);

export const generateArticle = (matchId: string, options?: ApiOptions) =>
  request(`/articles/generate/${matchId}`, options, { method: "POST" });

export const updateArticle = (articleId: string, payload: Record<string, unknown>, options?: ApiOptions) =>
  request(`/articles/${articleId}`, options, { method: "PATCH", body: JSON.stringify(payload) });

export const publishArticle = (articleId: string, options?: ApiOptions) =>
  request(`/articles/${articleId}/publish`, options, { method: "POST" });

export const unpublishArticle = (articleId: string, options?: ApiOptions) =>
  request(`/articles/${articleId}/unpublish`, options, { method: "POST" });

export const addArticleComment = (articleId: string, author: string, content: string, options?: ApiOptions) =>
  request(`/articles/${articleId}/comments`, options, {
    method: "POST",
    body: JSON.stringify({ author, content }),
  });

export const fetchSocialEvents = (options?: ApiOptions) => request<unknown[]>("/social/events", options);

export const createSocialEvent = (payload: Record<string, unknown>, options?: ApiOptions) =>
  request(`/social/events`, options, { method: "POST", body: JSON.stringify(payload) });

export const signupSocialEvent = (eventId: string, options?: ApiOptions) =>
  request(`/social/events/${eventId}/signup`, options, { method: "POST" });

export const cancelSignupEvent = (eventId: string, options?: ApiOptions) =>
  request(`/social/events/${eventId}/cancel-signup`, options, { method: "POST" });

export const simulateEventDeadline = (eventId: string, options?: ApiOptions) =>
  request(`/social/events/${eventId}/simulate-deadline`, options, { method: "POST" });

export const fetchNotifications = (options?: ApiOptions) => request<unknown[]>("/notifications", options);

export const markAllNotificationsRead = (options?: ApiOptions) =>
  request(`/notifications/read-all`, options, { method: "POST" });

// ---------- AI ----------
export const fetchPrediction = (matchId: string, options?: ApiOptions) =>
  request(`/ai/predict/${matchId}`, options);

export const fetchTactics = (matchId: string, options?: ApiOptions) =>
  request(`/ai/tactics/${matchId}`, options);

export const fetchAiStatus = (options?: ApiOptions) => request(`/ai/status`, options);

export function parseScheduleFile(file: File, options?: ApiOptions): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/ai/parse-schedule`, options, {
    method: "POST",
    body: formData,
    headers: { "X-User-Id": options?.userId ?? DEFAULT_USER_ID, "X-User-Role": options?.role ?? DEFAULT_ROLE },
  });
}

export function isApiReachable(): Promise<boolean> {
  return fetch(`${API_BASE}/health`)
    .then((response) => response.ok)
    .catch(() => false);
}
