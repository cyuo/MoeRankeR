// Cloudflare Pages Functions API 测试端点
// 路径: /api/test

import { EventContext, ApiEnv } from '../types';
import { getEnvVar, isDevelopment, getJwtSecret, getCorsOrigins } from '../utils/env';

export async function onRequestGet(context: EventContext<ApiEnv, any, any>) {
  try {
    // 测试数据库连接
    const result = await context.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();

    // 获取环境变量
    const environment = getEnvVar(context.env, 'ENVIRONMENT', 'unknown');
    const jwtSecret = getJwtSecret(context.env);
    const corsOrigins = getCorsOrigins(context.env);
    const isDevMode = isDevelopment(context.env);

    return Response.json({
      success: true,
      message: "API 和数据库连接正常",
      environment: {
        mode: environment,
        isDevelopment: isDevMode,
        corsOrigins: corsOrigins,
        jwtSecretLength: jwtSecret.length, // 只显示长度，不显示实际值
      },
      database: {
        connected: true,
        tables: result.results,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    
    return Response.json({
      success: false,
      message: "数据库连接失败",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<ApiEnv, any, any>) {
  try {
    const { action } = await context.request.json();
    
    if (action === 'init') {
      // 测试插入一些示例数据
      const insertResult = await context.env.DB.prepare(`
        INSERT OR IGNORE INTO users (email, username, password_hash) 
        VALUES (?, ?, ?)
      `).bind('test@example.com', 'testuser', 'hashedpassword123').run();

      return Response.json({
        success: true,
        message: "测试数据插入成功",
        insertId: insertResult.meta.last_row_id,
        environment: getEnvVar(context.env, 'ENVIRONMENT', 'unknown')
      });
    }

    if (action === 'env-test') {
      // 测试环境变量获取
      try {
        const testVars = {
          environment: getEnvVar(context.env, 'ENVIRONMENT', 'development'),
          hasJwtSecret: !!getJwtSecret(context.env),
          corsOrigins: getCorsOrigins(context.env),
          isDev: isDevelopment(context.env)
        };

        return Response.json({
          success: true,
          message: "环境变量测试成功",
          variables: testVars
        });
      } catch (envError) {
        return Response.json({
          success: false,
          message: "环境变量测试失败",
          error: envError instanceof Error ? envError.message : String(envError)
        }, { status: 500 });
      }
    }

    return Response.json({
      success: false,
      message: "未知操作，支持的操作: init, env-test"
    }, { status: 400 });
  } catch (error) {
    console.error('API 处理失败:', error);
    
    return Response.json({
      success: false,
      message: "API 处理失败",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 