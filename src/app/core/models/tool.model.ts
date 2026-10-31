export type ToolCategory =
  | 'formatters'
  | 'parsers'
  | 'diff'
  | 'converters'
  | 'crypto'
  | 'dotnet';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  categoryName: string;
  route: string;
  icon: string;
  tags: string[];
  keywords?: string[];
  badge?: string;
  isPopular?: boolean;
}

export interface ToolCategoryGroup {
  id: ToolCategory;
  title: string;
  icon: string;
  description: string;
  tools: ToolDefinition[];
}
