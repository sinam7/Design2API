export interface SchemaResponse {
  status: number;
  success: boolean;
  data: Record<string, unknown>;
  metadata: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
  error?: string;
} 