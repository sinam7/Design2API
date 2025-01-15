import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from '@/lib/utils/encryption';

const SETTINGS_COOKIE_NAME = 'user_settings';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export async function GET() {
  try {
    const cookieStore = await cookies();
    const settingsCookie = cookieStore.get(SETTINGS_COOKIE_NAME);
    
    if (!settingsCookie?.value) {
      return NextResponse.json({
        openaiApiKey: '',
        figmaAccessToken: '',
        figmaFileId: ''
      });
    }

    const decryptedSettings = decrypt(settingsCookie.value);
    const settings = JSON.parse(decryptedSettings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('설정 복호화 중 오류 발생:', error);
    return NextResponse.json(
      { error: '설정을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    
    // 설정 유효성 검사
    if (!settings.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키는 필수입니다.' },
        { status: 400 }
      );
    }

    // 설정을 암호화하여 쿠키에 저장
    const encryptedSettings = encrypt(JSON.stringify(settings));
    
    const response = NextResponse.json({ success: true });
    const cookieStore = await cookies();
    
    // 암호화된 설정을 쿠키에 저장
    cookieStore.set(SETTINGS_COOKIE_NAME, encryptedSettings, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('설정 저장 중 오류 발생:', error);
    return NextResponse.json(
      { error: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 