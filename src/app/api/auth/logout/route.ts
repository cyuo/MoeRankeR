import { NextRequest, NextResponse } from 'next/server';
import { lucia } from '@/lib/auth';
import { cookies } from 'next/headers'; // Import cookies

export async function POST(req: NextRequest) { // Lucia v3 examples often use POST for logout
    try {
        // Correctly get cookies
        const cookieStore = await cookies(); // Get the cookie store
        const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

        if (!sessionId) {
            return NextResponse.json({ success: false, message: 'Unauthorized: No session found' }, { status: 401 });
        }

        const { session } = await lucia.validateSession(sessionId); // validateSession is async
        if (!session) {
            // Session is invalid or expired, clear the cookie just in case
            const sessionCookie = lucia.createBlankSessionCookie();
            const response = NextResponse.json({ success: true, message: 'Logged out (session already invalid)' });
            response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            return response;
        }

        await lucia.invalidateSession(session.id); // invalidateSession is async

        const blankSessionCookie = lucia.createBlankSessionCookie();
        
        const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
        response.cookies.set(blankSessionCookie.name, blankSessionCookie.value, blankSessionCookie.attributes);
        return response;

    } catch (error: any) {
        console.error('Logout API error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
} 