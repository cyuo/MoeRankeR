import { ApiEnv } from '../../types';
import { loginUser, createSessionResponse } from '../../utils/auth';
import { corsHeaders } from '../../utils/cors';

interface LoginRequest {
  username: string;
  password: string;
  captchaToken: string;
}

export async function onRequestPost(context: { request: Request; env: ApiEnv }) {
  const { request, env } = context;

  try {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // 解析请求体
    let data: LoginRequest;
    try {
      data = await request.json() as LoginRequest;
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '无效的请求格式'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 验证请求参数
    const { username, password, captchaToken } = data;
    if (!username || !password || !captchaToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '缺少必要参数'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 执行登录
    const result = await loginUser(env, username, password, captchaToken, request);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.message
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

    // 登录成功，创建会话响应
    const { sessionId, user } = result;
    const responseData = {
      success: true,
      message: '登录成功',
      user
    };

    // 返回带会话Cookie的响应
    const response = createSessionResponse(responseData, sessionId as string);
    
    // 添加CORS头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('登录处理失败:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : '登录处理失败'
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