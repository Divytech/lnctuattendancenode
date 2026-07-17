import { NextRequest, NextResponse } from 'next/server';
import { createFastClient, LOGIN_URL, getAspFormData } from '@/lib/accsoft';
import { getSession } from '@/lib/session';
import * as cheerio from 'cheerio';
import qs from 'querystring';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password || username.length > 15 || password.length > 30) {
      return NextResponse.json({ success: false, error: 'Invalid credentials format' }, { status: 400 });
    }

    const client = createFastClient();
    
    // 1. GET request to fetch ASP.NET ViewState
    const getRes = await client.get(LOGIN_URL);
    const $ = cheerio.load(getRes.data);
    const payload = getAspFormData($);
    
    // 2. Add login credentials
    Object.assign(payload, {
      'ctl00$cph1$rdbtnlType': '2',
      'ctl00$cph1$txtStuUser': username,
      'ctl00$cph1$txtStuPsw': password,
      'ctl00$cph1$btnStuLogin': 'Login »'
    });

    // Axios requires form-urlencoded data for ASP.NET
    const postData = qs.stringify(payload);

    // 3. POST request
    const postRes = await client.post(LOGIN_URL, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      // Ensure we don't automatically follow redirect so we can capture cookies
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 400
    });

    // Combine cookies from GET and POST
    const rawCookies = [...(getRes.headers['set-cookie'] || []), ...(postRes.headers['set-cookie'] || [])];
    const accsoftCookies: Record<string, string> = {};
    
    rawCookies.forEach(cookieStr => {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        accsoftCookies[parts[0]] = parts.slice(1).join('=');
      }
    });

    // Check success: On successful login, AccSoft usually returns 302 redirecting to a dashboard/student page.
    // If it returns 200, it means it re-rendered the login page with an error.
    const isSuccessRedirect = postRes.status === 302 && postRes.headers.location && !postRes.headers.location.includes('StudentLogin');
    
    const responseText = postRes.data ? postRes.data.toString() : '';
    const isFailedContent = responseText.includes('Invalid User ID or Password') || responseText.includes('StudentLogin.aspx');

    if (isSuccessRedirect || (!isFailedContent && postRes.status !== 200)) {
      const session = await getSession();
      session.accsoftCookies = accsoftCookies;
      session.isLoggedIn = true;
      await session.save();

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

  } catch (error) {
    console.error("AccSoft Login Error:", error);
    return NextResponse.json({ success: false, error: 'AccSoft is busy right now. Try again later.' }, { status: 500 });
  }
}
