export type FigmaNodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'RECTANGLE'
  | 'TEXT'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE';

export interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  children?: FigmaNode[];
  characters?: string;
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  scrollBehavior?: string;
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  color?: FigmaColor;
  blendMode: string;
}

export interface FigmaStroke {
  type: 'SOLID';
  color: FigmaColor;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface APISchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  items?: APISchema;  // for array types
  properties?: Record<string, APISchema>;  // for object types
} 