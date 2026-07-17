import { NextRequest, NextResponse } from 'next/server';
import { createMgmtClient, MGMT_POST_URL } from '@/lib/ums';
import { getSession } from '@/lib/session';
import qs from 'querystring';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const umsCookies = session.umsCookies;

    if (!umsCookies) {
      return NextResponse.json({ success: false, error: 'Session expired. Please reload.' }, { status: 400 });
    }

    // Build cookie string from session
    const cookieString = Object.entries(umsCookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const client = createMgmtClient(cookieString);

    const { username, userdtl, captchaDeText, captchaInputText, requestVerificationToken } = await req.json();

    if (!username || !userdtl || username.length > 15 || !/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json({ success: false, error: 'Invalid username format' }, { status: 400 });
    }

    const payload = {
      '__RequestVerificationToken': requestVerificationToken,
      'username': username,
      'userdtl': userdtl,
      'CaptchaDeText': captchaDeText,
      'CaptchaInputText': captchaInputText
    };

    const postData = qs.stringify(payload);

    const postRes = await client.post(MGMT_POST_URL, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400
    });

    // Check if login failed (server returns login page again instead of dashboard)
    const location = postRes.headers.location || '';
    const isFailedRedirect = postRes.status === 302 && 
      (location.includes('Login') || location.includes('Home')) && 
      !location.includes('Dashboard') && !location.includes('Student');
      
    const responseText = postRes.data ? postRes.data.toString() : '';
    const isFailedContent = responseText.includes('Secure Sign In') || responseText.includes('name="username"');

    if (isFailedRedirect || isFailedContent || postRes.status === 200) {
      return NextResponse.json({ success: false, error: 'Invalid credentials or captcha.' }, { status: 401 });
    }

    // Capture newly set cookies (authentication cookies)
    const rawCookies = postRes.headers['set-cookie'] || [];
    rawCookies.forEach(cookieStr => {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        umsCookies[parts[0]] = parts.slice(1).join('=');
      }
    });

    // Update session
    session.umsCookies = umsCookies;
    session.enrollment = username;
    await session.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("UMS Login Error:", error);
    return NextResponse.json({ success: false, error: 'Management server is down.' }, { status: 500 });
  }
}
