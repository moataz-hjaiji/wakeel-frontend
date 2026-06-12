export interface Store {
  id: string;
  name: string;
  email: string;
  webhookSecret: string;
}

export interface AuthResponse {
  access_token: string;
  store: Store;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}
