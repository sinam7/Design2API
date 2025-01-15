import OpenAI from 'openai';
import { FigmaNode } from '../figma/types';
import { SchemaResponse } from '../types/schema';

interface ModelConfig {
  model: 'gpt-4o-mini-2024-07-18';
  temperature: number;
  maxRetries?: number;
}

const DEFAULT_CONFIG: ModelConfig = {
  model: 'gpt-4o-mini-2024-07-18',
  temperature: 0.3,
  maxRetries: 2
};

class OpenAIClient {
  private client: OpenAI | null = null;
  private config: ModelConfig;

  constructor(config: Partial<ModelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setApiKey(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateResponseSchema(
    frameName: string,
    components: FigmaNode[],
    additionalContext?: string
  ): Promise<SchemaResponse> {
    if (!this.client) {
      throw new Error('OpenAI client is not initialized. Please set API key first.');
    }

    try {
      const componentAnalysis = components.map(comp => ({
        name: comp.name,
        type: comp.type,
        text: comp.characters || '',
        children: comp.children?.length || 0,
        properties: {
          fills: comp.fills,
          strokes: comp.strokes,
          scrollBehavior: comp.scrollBehavior
        }
      }));

      const prompt = `As an API designer, analyze this Figma UI frame and generate appropriate API response JSON.

Frame Name: "${frameName}"

UI Components:
${JSON.stringify(componentAnalysis, null, 2)}

${additionalContext ? `Context: ${additionalContext}\n` : ''}

Requirements:
1. Generate a JSON response that would populate this UI frame
2. Follow these rules:
   - Use camelCase for property names
   - Text fields should have appropriate string values
   - Buttons should have associated actions/states
   - Lists should have array structures
   - Images should have URLs and alt texts
   - Forms should have input field structures
   - Include proper data types (string, number, boolean, array, object)
   - Add proper validation rules where applicable (e.g., required fields)
3. Consider the frame's purpose:
   - If it's a list view, generate array of items
   - If it's a detail view, generate single object
   - If it's a form, generate field structure
   - If it's a dashboard, generate statistics/metrics
4. Include these in the response:
   - HTTP status code (200 for success)
   - Success flag (true for success case)
   - Timestamps in ISO 8601 format
   - Pagination info for lists (page, limit, total)
   - Proper error handling structure

Response Format:
{
  "status": number,
  "success": boolean,
  "data": {
    // Generated data structure here
  },
  "metadata": {
    "timestamp": string,
    "pagination?: {
      "page": number,
      "limit": number,
      "total": number
    }
  }
}

Consider the visual hierarchy and relationships between components when generating the data structure.
Respond ONLY with the JSON, no explanations or additional text.`;

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert API designer specializing in RESTful APIs and JSON schema design.
Your task is to analyze UI components and generate appropriate API response structures.
Always maintain consistency in naming and data structures.
Consider both frontend requirements and backend feasibility.
Focus on creating practical, implementation-ready API responses.`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature
      });

      const jsonResponse = response.choices[0]?.message?.content || '{}';
      const cleanJson = jsonResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Failed to generate response schema:', error);
      throw error;
    }
  }
}

// 서버 사이드 전용 클라이언트
export const openAIClient = new OpenAIClient(); 