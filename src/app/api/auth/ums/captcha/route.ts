import { NextResponse } from 'next/server';
import { createMgmtClient, MGMT_LOGIN_URL, MGMT_BASE_URL } from '@/lib/ums';
import * as cheerio from 'cheerio';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const client = createMgmtClient();
    const response = await client.get(MGMT_LOGIN_URL);
    
    const $ = cheerio.load(response.data);
    const token = $('input[name="__RequestVerificationToken"]').val();
    const captchaDeText = $('#CaptchaDeText').val();
    
    // Store the temporary cookies in the session for the upcoming login attempt
    const rawCookies = response.headers['set-cookie'] || [];
    const umsCookies: Record<string, string> = {};
    rawCookies.forEach(cookieStr => {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        umsCookies[parts[0]] = parts.slice(1).join('=');
      }
    });

    const cookieString = Object.entries(umsCookies).map(([k, v]) => `${k}=${v}`).join('; ');

    let captchaImg = '';
    const captchaImgTag = $('#CaptchaImage').attr('src');
    
    if (captchaImgTag) {
      const fullCaptchaUrl = `${MGMT_BASE_URL}${captchaImgTag}`;
      const imgResponse = await client.get(fullCaptchaUrl, { 
        responseType: 'arraybuffer',
        headers: { Cookie: cookieString }
      });
      
      if (imgResponse.status === 200) {
        captchaImg = Buffer.from(imgResponse.data, 'binary').toString('base64');
      }
    }

    const session = await getSession();
    session.umsCookies = umsCookies;
    await session.save();
    
    return NextResponse.json({
      success: true,
      token,
      captcha_de_text: captchaDeText,
      captcha_img: captchaImg
    });

  } catch (error) {
    console.error("UMS Captcha fetch error:", error);
    return NextResponse.json({ success: false, error: 'Failed to load CAPTCHA' }, { status: 500 });
  }
}
