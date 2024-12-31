import { FigmaNode, APISchema } from '../figma/types';

export class SchemaGenerator {
  generateBaseSchema(node: FigmaNode): APISchema {
    switch (node.type) {
      case 'FRAME':
        return this.generateFrameSchema(node);
      case 'TEXT':
        return this.generateTextSchema(node);
      case 'RECTANGLE':
        return this.generateRectangleSchema(node);
      default:
        return {
          name: this.sanitizeName(node.name),
          type: 'object',
          description: `Generated from ${node.type}`,
        };
    }
  }

  private generateFrameSchema(node: FigmaNode): APISchema {
    const properties: Record<string, APISchema> = {};
    
    node.children?.forEach((child) => {
      const childSchema = this.generateBaseSchema(child);
      properties[this.sanitizeName(child.name)] = childSchema;
    });

    return {
      name: this.sanitizeName(node.name),
      type: 'object',
      properties,
      description: `API schema for ${node.name}`,
    };
  }

  private generateTextSchema(node: FigmaNode): APISchema {
    return {
      name: this.sanitizeName(node.name),
      type: 'string',
      description: node.characters || `Text field from ${node.name}`,
    };
  }

  private generateRectangleSchema(node: FigmaNode): APISchema {
    return {
      name: this.sanitizeName(node.name),
      type: 'object',
      properties: {
        type: {
          name: 'type',
          type: 'string',
          description: 'Type of the element (button/image)',
        },
        action: {
          name: 'action',
          type: 'string',
          description: 'Action to perform',
        }
      }
    };
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }
} 