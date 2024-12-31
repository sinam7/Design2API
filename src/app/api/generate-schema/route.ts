import { NextResponse } from 'next/server';
import { openAIClient } from '@/lib/openai/server';
import { FigmaNode } from '@/lib/figma/types';

export async function POST(request: Request) {
  try {
    const { frameName, components, openaiApiKey } = await request.json();

    console.log('Request to OpenAI:');
    console.log('Frame Name:', frameName);
    console.log('Components:', JSON.stringify(components, null, 2));

    const response = await openAIClient.generateResponseSchema(
      frameName,
      components
    );

    console.log('\nResponse Content:');
    console.log(response);

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