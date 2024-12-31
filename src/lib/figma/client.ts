import { FigmaNode, FigmaNodeType } from './types';

export interface FigmaFile {
  document: {
    id: string;
    name: string;
    type: FigmaNodeType;
    children: FigmaNode[];
  };
  components: { [key: string]: any };
  schemaVersion: number;
  name: string;
}

class FigmaClient {
  private accessToken: string;
  private fileId: string;

  constructor(accessToken?: string, fileId?: string) {
    this.accessToken = accessToken || '';
    this.fileId = fileId || '';
  }

  setCredentials(accessToken: string, fileId: string) {
    this.accessToken = accessToken;
    this.fileId = fileId;
  }

  async getFile() {
    if (!this.accessToken || !this.fileId) {
      throw new Error('Figma credentials not set. Please configure them in settings.');
    }

    const response = await fetch(
      `https://api.figma.com/v1/files/${this.fileId}`,
      {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Invalid Figma access token');
      } else if (response.status === 404) {
        throw new Error('404: Figma file not found');
      }
      throw new Error(`${response.status}: Failed to fetch Figma file`);
    }

    return response.json();
  }

  async getImage(nodeId: string) {
    if (!this.accessToken || !this.fileId) {
      throw new Error('Figma credentials not set. Please configure them in settings.');
    }

    const response = await fetch(
      `https://api.figma.com/v1/images/${this.fileId}?ids=${nodeId}&format=png`,
      {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const data = await response.json();
    return data.images[nodeId];
  }

  async getFileNodes(nodeIds: string[]): Promise<any> {
    if (!this.accessToken || !this.fileId) {
      throw new Error('Figma credentials not set. Please configure them in settings.');
    }

    const response = await fetch(
      `https://api.figma.com/v1/files/${this.fileId}/nodes?ids=${nodeIds.join(',')}`,
      {
        headers: {
          'X-Figma-Token': this.accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Figma nodes');
    }

    const data = await response.json();
    return data;
  }
}

export const figmaClient = new FigmaClient(); 