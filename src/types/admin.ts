export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  admin: SuperAdmin;
}

export interface TokenUsageSummary {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost: number;
}

export interface TokenLimitStatus {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface StoreWithUsage {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  monthlyTokenLimit: number | null;
  usage: TokenUsageSummary;
  limitStatus: TokenLimitStatus;
}

export interface AdminOverview {
  period: { startDate: string; endDate: string };
  totals: TokenUsageSummary;
  storeCount: number;
  stores: StoreWithUsage[];
}
