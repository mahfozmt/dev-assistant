import { TestBed } from '@angular/core/testing';
import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register all 6 core categories', () => {
    expect(service.categories.length).toBe(6);
    const categoryIds = service.categories.map(c => c.id);
    expect(categoryIds).toEqual(['formatters', 'parsers', 'diff', 'converters', 'crypto', 'dotnet']);
  });

  it('should search tools by keyword and name', () => {
    const jsonMatches = service.search('json');
    expect(jsonMatches.length).toBeGreaterThan(0);
    expect(jsonMatches.some(t => t.id === 'json-formatter')).toBeTrue();

    const pocoMatches = service.search('poco');
    expect(pocoMatches.length).toBeGreaterThan(0);
    expect(pocoMatches.some(t => t.id === 'csharp-to-ts')).toBeTrue();
  });

  it('should find tools by route', () => {
    const tool = service.getToolByRoute('/tools/formatters/json');
    expect(tool).toBeDefined();
    expect(tool?.name).toContain('JSON');
  });

  it('should toggle favorites', () => {
    const toolId = 'sql-formatter';
    const initialFavorite = service.isFavorite(toolId);
    service.toggleFavorite(toolId);
    expect(service.isFavorite(toolId)).toBe(!initialFavorite);
    service.toggleFavorite(toolId);
    expect(service.isFavorite(toolId)).toBe(initialFavorite);
  });
});
