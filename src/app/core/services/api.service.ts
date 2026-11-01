import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface RegexTestApiResponse {
  isValid: boolean;
  error: string | null;
  matchCount: number;
  elapsedMs: number;
  replacedText: string | null;
  groupNames: string[];
  matches: {
    matchNumber: number;
    value: string;
    index: number;
    length: number;
    groups: {
      name: string;
      value: string;
      index: number;
      length: number;
      success: boolean;
      captures: { value: string; index: number; length: number }[];
    }[];
  }[];
}

export interface TSqlAnalyzeApiResponse {
  isValid: boolean;
  formattedSql: string;
  errors: { line: number; column: number; number: number; message: string }[];
  referencedTables: {
    server: string | null;
    database: string | null;
    schema: string;
    table: string;
    alias: string | null;
    startLine: number;
    startColumn: number;
  }[];
  statementCount: number;
}

export interface ConnectionStringInspectApiResponse {
  isValid: boolean;
  detectedProvider: string;
  normalizedConnectionString: string;
  redactedConnectionString: string;
  error: string | null;
  settings: {
    key: string;
    value: string;
    category: string;
    description: string;
    isSensitive: boolean;
  }[];
  warnings: {
    severity: 'warning' | 'error' | 'info';
    key: string;
    message: string;
    recommendation: string;
  }[];
}

export interface JsonToCSharpApiResponse {
  isValid: boolean;
  code: string;
  error: string | null;
  generatedTypeCount: number;
}

export interface FormatTimezoneApiResponse {
  isValid: boolean;
  error: string | null;
  cultureResults: {
    culture: string;
    displayName: string;
    formattedOutput: string;
    error: string | null;
  }[];
  timeZoneResults: {
    requestedId: string;
    resolvedId: string;
    ianaId: string | null;
    windowsId: string | null;
    displayName: string;
    convertedIso: string;
    formattedLocal: string;
    utcOffset: string;
    isDaylightSavingTime: boolean;
    error: string | null;
  }[];
}

export interface RoslynDiagnosticDto {
  id: string;
  severity: string;
  message: string;
  line: number;
  column: number;
}

export interface RoslynSyntaxNodeDto {
  kind: string;
  span: string;
  identifier: string | null;
  children: RoslynSyntaxNodeDto[];
}

export interface RoslynInspectApiResponse {
  success: boolean;
  error: string | null;
  elapsedMs: number;
  diagnostics: RoslynDiagnosticDto[];
  syntaxTree: RoslynSyntaxNodeDto | null;
  loweredCSharp: string;
  ilCode: string;
}

export interface CSharpToTsRoslynApiResponse {
  isValid: boolean;
  typeScriptCode: string;
  typeCount: number;
  diagnostics: RoslynDiagnosticDto[];
}

export interface CSharpToJsonSchemaRoslynApiResponse {
  isValid: boolean;
  jsonSchema: string;
  rootType: string | null;
  diagnostics: RoslynDiagnosticDto[];
}

export interface SnippetApiResponse {
  id: string;
  tool: string;
  title: string | null;
  content: string;
  createdAt: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = environment.apiBaseUrl;
  readonly isAvailable = signal<boolean | null>(null);
  readonly statusMessage = signal<string>('Connecting to api.mahfozmt.com...');

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        this.isAvailable.set(true);
        this.statusMessage.set('Connected to .NET 10 Server (api.mahfozmt.com)');
        return true;
      }
      this.isAvailable.set(false);
      this.statusMessage.set('The .NET 10 API server returned an unexpected status.');
      return false;
    } catch {
      this.isAvailable.set(false);
      this.statusMessage.set('The .NET 10 API server (api.mahfozmt.com) is currently unreachable.');
      return false;
    }
  }

  async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let detail = `Server returned HTTP ${response.status}.`;
        try {
          const problem = await response.json();
          if (problem?.detail) detail = problem.detail;
          else if (problem?.title) detail = problem.title;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(detail);
      }

      this.isAvailable.set(true);
      return (await response.json()) as TResponse;
    } catch (err) {
      if (err instanceof TypeError) {
        this.isAvailable.set(false);
        this.statusMessage.set('The .NET 10 API server (api.mahfozmt.com) is currently unavailable.');
        throw new Error('The .NET 10 API server (api.mahfozmt.com) is currently unavailable. Please try again in a moment.');
      }
      throw err;
    }
  }

  async get<TResponse>(path: string): Promise<TResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        let detail = `Server returned HTTP ${response.status}.`;
        try {
          const problem = await response.json();
          if (problem?.detail) detail = problem.detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      this.isAvailable.set(true);
      return (await response.json()) as TResponse;
    } catch (err) {
      if (err instanceof TypeError) {
        this.isAvailable.set(false);
        throw new Error('The .NET 10 API server (api.mahfozmt.com) is currently unavailable.');
      }
      throw err;
    }
  }

  testDotnetRegex(payload: {
    pattern: string;
    input: string;
    replacement?: string | null;
    options?: string[];
  }): Promise<RegexTestApiResponse> {
    return this.post<RegexTestApiResponse>('/api/dotnet/regex', payload);
  }

  analyzeTSql(payload: {
    sql: string;
    sqlVersion?: string;
    indentationSize?: number;
    keywordCasing?: string;
  }): Promise<TSqlAnalyzeApiResponse> {
    return this.post<TSqlAnalyzeApiResponse>('/api/dotnet/tsql', payload);
  }

  inspectConnectionString(payload: {
    connectionString: string;
    provider?: string;
  }): Promise<ConnectionStringInspectApiResponse> {
    return this.post<ConnectionStringInspectApiResponse>('/api/dotnet/connection-string', payload);
  }

  convertJsonToCSharp(payload: {
    json: string;
    rootTypeName?: string;
    namespace?: string;
    useRecords?: boolean;
    useSystemTextJsonAttributes?: boolean;
    useNullableReferenceTypes?: boolean;
    usePascalCase?: boolean;
  }): Promise<JsonToCSharpApiResponse> {
    return this.post<JsonToCSharpApiResponse>('/api/dotnet/json-to-csharp', payload);
  }

  testFormatAndTimeZone(payload: {
    rawValue?: string;
    valueType?: string;
    formatString?: string;
    cultures?: string[];
    timestampIso?: string;
    sourceTimeZone?: string;
    targetTimeZones?: string[];
  }): Promise<FormatTimezoneApiResponse> {
    return this.post<FormatTimezoneApiResponse>('/api/dotnet/format-timezone', payload);
  }

  inspectRoslyn(payload: {
    code: string;
    optimizationLevel?: string;
    maxSyntaxTreeDepth?: number;
  }): Promise<RoslynInspectApiResponse> {
    return this.post<RoslynInspectApiResponse>('/api/roslyn/inspect', payload);
  }

  convertCSharpToTsRoslyn(payload: {
    code: string;
    useTypeInsteadOfInterface?: boolean;
    camelCaseProperties?: boolean;
    exportKeywords?: boolean;
    dateMapping?: string;
  }): Promise<CSharpToTsRoslynApiResponse> {
    return this.post<CSharpToTsRoslynApiResponse>('/api/roslyn/csharp-to-ts', payload);
  }

  convertCSharpToJsonSchemaRoslyn(payload: {
    code: string;
    rootTypeName?: string | null;
    camelCaseProperties?: boolean;
    additionalPropertiesFalse?: boolean;
  }): Promise<CSharpToJsonSchemaRoslynApiResponse> {
    return this.post<CSharpToJsonSchemaRoslynApiResponse>('/api/roslyn/csharp-to-json-schema', payload);
  }

  createSnippet(payload: {
    tool: string;
    content: string;
    title?: string;
    expiresInDays?: number;
  }): Promise<SnippetApiResponse> {
    return this.post<SnippetApiResponse>('/api/snippets', payload);
  }

  getSnippet(id: string): Promise<SnippetApiResponse> {
    return this.get<SnippetApiResponse>(`/api/snippets/${encodeURIComponent(id)}`);
  }
}
