import { ApiEnv } from '../types';
import { getEnvVar } from './env';

/**
 * 获取CORS头部
 */
export function getCorsHeaders(env: ApiEnv): Record<string, string> {
  const corsOrigin = getEnvVar(env, 'CORS_ORIGIN', '*');
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24小时
  };
}

/**
 * 默认CORS头部（用于不需要环境变量的场景）
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24小时
}; 