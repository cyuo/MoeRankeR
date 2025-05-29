// 环境变量处理工具

import { ApiEnv } from '../types';

/**
 * 从环境变量中获取值，如果不存在则返回默认值
 * @param env API环境变量
 * @param key 环境变量名称
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
export function getEnvVar(env: ApiEnv, key: string, defaultValue: string = ''): string {
  return (env && env[key as keyof ApiEnv]) as string || defaultValue;
}

/**
 * 检查是否为开发环境
 * @param env API环境变量
 * @returns 是否为开发环境
 */
export function isDevelopment(env: ApiEnv): boolean {
  return getEnvVar(env, 'ENVIRONMENT', '').toLowerCase() === 'development';
}

/**
 * 获取环境变量值并转换为布尔值
 * @param env API环境变量
 * @param key 环境变量名称
 * @param defaultValue 默认值
 * @returns 布尔值
 */
export function getBooleanEnvVar(env: ApiEnv, key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(env, key, '').toLowerCase();
  if (value === '') return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * 获取环境变量值并转换为数字
 * @param env API环境变量
 * @param key 环境变量名称
 * @param defaultValue 默认值
 * @returns 数字值
 */
export function getNumberEnvVar(env: ApiEnv, key: string, defaultValue: number = 0): number {
  const value = getEnvVar(env, key, '');
  if (value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 获取调试模式状态
 * @param env API环境变量
 * @returns 是否启用调试模式
 */
export function isDebugMode(env: ApiEnv): boolean {
  return getBooleanEnvVar(env, 'DEBUG', false);
}

/**
 * 获取数字类型的环境变量
 */
export function getEnvNumber(
  env: ApiEnv,
  key: string,
  defaultValue?: number
): number {
  const value = getEnvVar(env, key, defaultValue?.toString());
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new Error(`环境变量 ${key} 不是有效数字: ${value}`);
  }
  
  return num;
}

/**
 * 获取布尔类型的环境变量
 */
export function getEnvBoolean(
  env: ApiEnv,
  key: string,
  defaultValue?: boolean
): boolean {
  const value = getEnvVar(env, key, defaultValue?.toString());
  return value.toLowerCase() === 'true';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(env: ApiEnv): boolean {
  const environment = getEnvVar(env, 'ENVIRONMENT', 'development');
  return environment === 'production';
}

/**
 * 获取 JWT 密钥
 */
export function getJwtSecret(env: ApiEnv): string {
  return getEnvVar(env, 'JWT_SECRET', 'default-dev-secret-key');
}

/**
 * 获取 CORS 配置
 */
export function getCorsOrigins(env: ApiEnv): string[] {
  const origins = getEnvVar(env, 'CORS_ORIGIN', 'http://localhost:3000,http://localhost:8080');
  return origins.split(',').map(origin => origin.trim());
}

/**
 * 获取 hCaptcha 站点密钥（前端使用）
 */
export function getHcaptchaSiteKey(env: ApiEnv): string {
  // 测试密钥：10000000-ffff-ffff-ffff-000000000001
  return getEnvVar(env, 'HCAPTCHA_SITEKEY', '10000000-ffff-ffff-ffff-000000000001');
}

/**
 * 获取 hCaptcha 密钥（后端使用）
 */
export function getHcaptchaSecret(env: ApiEnv): string {
  // 测试密钥：0x0000000000000000000000000000000000000000
  return getEnvVar(env, 'HCAPTCHA_SECRET', '0x0000000000000000000000000000000000000000');
}

/**
 * 检查是否使用 hCaptcha 测试密钥
 */
export function isHcaptchaTestMode(env: ApiEnv): boolean {
  const siteKey = getHcaptchaSiteKey(env);
  return siteKey === '10000000-ffff-ffff-ffff-000000000001';
} 