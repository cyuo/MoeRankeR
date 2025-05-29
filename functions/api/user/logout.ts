import { ApiEnv } from '../../types';
import { getSessionIdFromRequest, logoutSession, createLogoutResponse } from '../../utils/auth';
import { corsHeaders } from '../../utils/cors';

export async function onRequestPost(context: { request: Request; env: ApiEnv }) {
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
          message: '未登录'
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

    // 执行注销
    await logoutSession(env, sessionId);

    // 返回清除会话的响应
    const responseData = {
      success: true,
      message: '注销成功'
    };
    
    const response = createLogoutResponse(responseData);
    
    // 添加CORS头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('注销处理失败:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : '注销处理失败'
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