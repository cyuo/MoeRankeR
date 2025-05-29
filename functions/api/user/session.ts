import { ApiEnv } from '../../types';
import { getSessionIdFromRequest, validateSession } from '../../utils/auth';
import { corsHeaders } from '../../utils/cors';

export async function onRequestGet(context: { request: Request; env: ApiEnv }) {
  const { request, env } = context;

  try {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // 获取会话ID
    const sessionId = getSessionIdFromRequest(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '未登录',
          authenticated: false
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 验证会话
    const result = await validateSession(env, sessionId);
    if (!result.valid || !result.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '会话无效或已过期',
          authenticated: false
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 返回用户信息
    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        user: result.user
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('会话验证失败:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : '会话验证失败',
        authenticated: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 