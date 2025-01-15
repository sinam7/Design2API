import { NextResponse } from 'next/server';
import { openAIClient } from '@/lib/openai/server';

export async function POST(request: Request) {
  try {
    const { frameName, components, openaiApiKey } = await request.json();

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    // API 키 설정
    openAIClient.setApiKey(openaiApiKey);

    const response = await openAIClient.generateResponseSchema(
      frameName,
      components
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating schema:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'API 스키마 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 