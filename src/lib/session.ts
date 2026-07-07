import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

// Define the shape of our session data
export interface SessionData {
  accsoftCookies?: Record<string, string>;
  umsCookies?: Record<string, string>;
  isLoggedIn?: boolean;
  enrollment?: string;
  name?: string;
  password?: string;
}

// Session configuration
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || 'super-secret-lnct-key-change-this-in-production-it-must-be-32-chars-long',
  cookieName: 'lnct_attendance_session',
  cookieOptions: {
    // secure: true should be used in production (HTTPS) but can be false for localhost
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}
