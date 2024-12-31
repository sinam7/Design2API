import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { figmaAccessToken, figmaFileId, openaiApiKey } = await request.json();

    // .env.local 파일의 내용 업데이트
    const envContent = `FIGMA_ACCESS_TOKEN=${figmaAccessToken}
FIGMA_FILE_ID=${figmaFileId}
OPENAI_API_KEY=${openaiApiKey}`;

    // .env.local 파일 경로
    const envPath = path.join(process.cwd(), '.env.local');

    // 파일 쓰기
    await fs.writeFile(envPath, envContent, 'utf-8');

    // 환경 변수 업데이트
    process.env.FIGMA_ACCESS_TOKEN = figmaAccessToken;
    process.env.FIGMA_FILE_ID = figmaFileId;
    process.env.OPENAI_API_KEY = openaiApiKey;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: '설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 