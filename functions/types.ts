// Cloudflare Pages Functions 类型定义

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  dump(): Promise<ArrayBuffer>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
  first(column?: string): Promise<any>;
}

export interface D1Result {
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number;
    changes: number;
    served_by: string;
    internal_stats?: any;
  };
  results?: any[];
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface EventContext<Env = any, P = any, Data = any> {
  request: Request;
  env: Env;
  params: P;
  data: Data;
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
}

export interface ApiEnv {
  DB: D1Database;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN?: string;
  HCAPTCHA_SECRET?: string;
  HCAPTCHA_SITEKEY?: string;
  DEBUG?: string;
  LOG_LEVEL?: string;
} 