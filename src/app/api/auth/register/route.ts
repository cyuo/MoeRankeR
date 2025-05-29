import { NextRequest, NextResponse } from 'next/server';
import { lucia, UserModel, hashPassword, generateUserId } from '@/lib/auth';
import { verifyCaptcha } from '@/lib/captcha'; // 取消注释
// import { cookies } from 'next/headers'; // cookies() from next/headers is read-only for POST

export async function POST(req: NextRequest) {
    try {
        // 从环境变量获取预设的注册码
        const expectedRegisterCode = process.env.REGISTER_CODE;

        if (!expectedRegisterCode) {
            console.warn('REGISTER_CODE is not set in environment variables. Registration is disabled.');
            return NextResponse.json({ success: false, message: 'Registration is currently disabled.' }, { status: 403 }); // Forbidden
        }

        const { username, password, captchaToken, registerCode } = await req.json();

        // 验证注册码
        if (!registerCode) {
            return NextResponse.json({ success: false, message: 'Registration code is required.' }, { status: 400 });
        }
        if (registerCode !== expectedRegisterCode) {
            return NextResponse.json({ success: false, message: 'Invalid registration code.' }, { status: 403 }); // Forbidden
        }

        // 验证其他字段
        if (!username || !password) {
            return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
        }
        if (!captchaToken) {
            return NextResponse.json({ success: false, message: 'CAPTCHA token is required' }, { status: 400 });
        }

        if (typeof username !== 'string' || username.length < 3 || username.length > 31 || !/^[a-z0-9_-]+$/.test(username)) {
            return NextResponse.json({ success: false, message: 'Invalid username. Must be 3-31 characters, lowercase letters, numbers, underscores, or hyphens.' }, { status: 400 });
        }

        if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
            return NextResponse.json({ success: false, message: 'Invalid password. Must be 6-255 characters.' }, { status: 400 });
        }
        
        // hCaptcha 验证
        const forwardedFor = req.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
        const captchaValidation = await verifyCaptcha(captchaToken, clientIp);
        if (!captchaValidation.success) {
            return NextResponse.json({ success: false, message: captchaValidation.message || 'CAPTCHA verification failed' }, { status: 400 });
        }

        const existingUser = await UserModel.findOne({ username: username.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'Username already taken' }, { status: 409 }); // Conflict
        }

        const hashedPassword = await hashPassword(password);
        const userId = generateUserId();

        await UserModel.create({
            _id: userId,
            username: username.toLowerCase(),
            hashedPassword: hashedPassword,
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        
        const response = NextResponse.json(
            { success: true, message: 'User registered successfully', userId },
            { status: 201 }
        );
        response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return response;

    } catch (error: any) {
        console.error('Registration API error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
} 