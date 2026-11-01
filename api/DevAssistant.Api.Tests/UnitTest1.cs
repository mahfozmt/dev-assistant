using System.Net;
using System.Net.Http.Json;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using DevAssistant.Api.Endpoints;
using DevAssistant.Api.Services;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DevAssistant.Api.Tests;

public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_Returns200OkAndHealthyStatus()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"healthy\"", body);
        Assert.Contains("DevAssistant.Api", body);
    }

    [Fact]
    public async Task OpenApiDocument_Returns200Ok()
    {
        var response = await _client.GetAsync("/openapi/v1.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("DevAssistant .NET 10 API", json);
        Assert.Contains("/api/dotnet/regex", json);
        Assert.Contains("/api/roslyn/inspect", json);
    }

    [Fact]
    public async Task DotnetRegex_SupportsNamedAndBalancingGroupsAndRightToLeft()
    {
        var req = new RegexTestRequest(
            Pattern: @"(?<word>\w+)-(?<num>\d+)",
            Input: "item-42 and box-99",
            Replacement: "${num}:${word}",
            Options: ["IgnoreCase", "RightToLeft"]
        );

        var response = await _client.PostAsJsonAsync("/api/dotnet/regex", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<RegexTestResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Equal(2, result.MatchCount);
        Assert.Equal("42:item and 99:box", result.ReplacedText);
        // RightToLeft matches box-99 first!
        Assert.Equal("box-99", result.Matches[0].Value);
        Assert.Contains("word", result.GroupNames);
    }

    [Fact]
    public async Task TSqlAnalyzer_FormatsValidSqlAndExtractsReferencedTables()
    {
        var req = new TSqlAnalyzeRequest(
            Sql: "select u.Id, u.Name, o.Total from dbo.Users u inner join sales.Orders o on u.Id = o.UserId where u.IsActive = 1"
        );

        var response = await _client.PostAsJsonAsync("/api/dotnet/tsql", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TSqlAnalyzeResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
        Assert.Contains("SELECT", result.FormattedSql);
        Assert.Equal(2, result.ReferencedTables.Count);
        Assert.Contains(result.ReferencedTables, t => t.Table == "Users" && t.Schema == "dbo");
        Assert.Contains(result.ReferencedTables, t => t.Table == "Orders" && t.Schema == "sales");
    }

    [Fact]
    public async Task TSqlAnalyzer_ReportsLineAndColumnOnSyntaxError()
    {
        var req = new TSqlAnalyzeRequest("SELECT FROM WHERE");
        var response = await _client.PostAsJsonAsync("/api/dotnet/tsql", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<TSqlAnalyzeResponse>();
        Assert.NotNull(result);
        Assert.False(result.IsValid);
        Assert.NotEmpty(result.Errors);
        Assert.True(result.Errors[0].Line >= 1);
    }

    [Fact]
    public async Task ConnectionStringInspector_DetectsSqlServerWarningsAndRedactsPassword()
    {
        var req = new ConnectionStringInspectRequest(
            "Server=sql.example.com;Database=AppDb;User Id=sa;Password=SuperSecret123!;TrustServerCertificate=True;Encrypt=False;"
        );

        var response = await _client.PostAsJsonAsync("/api/dotnet/connection-string", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ConnectionStringInspectResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Equal("sqlserver", result.DetectedProvider);
        Assert.DoesNotContain("SuperSecret123!", result.RedactedConnectionString);
        Assert.Contains(result.Warnings, w => w.Key == "TrustServerCertificate");
        Assert.Contains(result.Warnings, w => w.Key == "Password");
    }

    [Fact]
    public async Task JsonToCSharp_GeneratesRecordsWithSystemTextJsonAttributes()
    {
        var req = new JsonToCSharpRequest(
            Json: """{"user_id": 101, "full_name": "Mahfoz", "tags": ["dotnet", "angular"]}""",
            RootTypeName: "UserProfile",
            UseRecords: true,
            UseSystemTextJsonAttributes: true
        );

        var response = await _client.PostAsJsonAsync("/api/dotnet/json-to-csharp", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<JsonToCSharpResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Contains("public sealed record UserProfile", result.Code);
        Assert.Contains("[JsonPropertyName(\"user_id\")]", result.Code);
        Assert.Contains("public int UserId", result.Code);
    }

    [Fact]
    public async Task FormatAndTimeZone_FormatsAcrossCulturesAndConvertsIanaAndWindowsIds()
    {
        var req = new FormatTimezoneRequest(
            RawValue: "12345.67",
            ValueType: "number",
            FormatString: "C2",
            Cultures: ["en-US", "bn-BD"],
            TimestampIso: "2026-11-01T12:00:00Z",
            TargetTimeZones: ["UTC", "Asia/Dhaka", "Bangladesh Standard Time"]
        );

        var response = await _client.PostAsJsonAsync("/api/dotnet/format-timezone", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<FormatTimezoneResponse>();
        Assert.NotNull(result);
        Assert.True(result.IsValid);
        Assert.Equal(2, result.CultureResults.Count);
        Assert.Equal(3, result.TimeZoneResults.Count);
        Assert.All(result.TimeZoneResults, tz => Assert.Null(tz.Error));
    }

    [Fact]
    public async Task RoslynInspect_CompilesInMemoryAndProducesSyntaxTreeLoweredCSharpAndIl()
    {
        var req = new RoslynInspectRequest(
            Code: """
            using System;
            public class Calculator
            {
                public int Add(int a, int b) => a + b;
            }
            """
        );

        var response = await _client.PostAsJsonAsync("/api/roslyn/inspect", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<RoslynInspectResponse>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.SyntaxTree);
        Assert.Contains("Calculator", result.LoweredCSharp);
        Assert.Contains("IL_0000", result.IlCode);
    }

    [Fact]
    public async Task RoslynInspect_RejectsCodeLargerThan20Kb()
    {
        var oversized = new string(' ', 21 * 1024);
        var response = await _client.PostAsJsonAsync("/api/roslyn/inspect", new RoslynInspectRequest(oversized));
        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task RoslynCSharpToTs_And_CSharpToJsonSchema_ParseAstCorrectly()
    {
        const string csharp = """
        using System;
        using System.ComponentModel.DataAnnotations;

        public enum OrderStatus { Pending, Paid }

        public record OrderDto
        {
            [Required]
            public Guid Id { get; init; }
            [StringLength(80, MinimumLength = 2)]
            public string CustomerName { get; init; } = "";
            public OrderStatus Status { get; init; }
            public decimal? Discount { get; init; }
        }
        """;

        var tsRes = await _client.PostAsJsonAsync("/api/roslyn/csharp-to-ts", new CSharpToTsRoslynRequest(csharp));
        Assert.Equal(HttpStatusCode.OK, tsRes.StatusCode);
        var tsBody = await tsRes.Content.ReadFromJsonAsync<CSharpToTsRoslynResponse>();
        Assert.NotNull(tsBody);
        Assert.True(tsBody.IsValid);
        Assert.Contains("export enum OrderStatus", tsBody.TypeScriptCode);
        Assert.Contains("export interface OrderDto", tsBody.TypeScriptCode);
        Assert.Contains("discount?: number | null;", tsBody.TypeScriptCode);

        var schemaRes = await _client.PostAsJsonAsync("/api/roslyn/csharp-to-json-schema", new CSharpToJsonSchemaRoslynRequest(csharp));
        Assert.Equal(HttpStatusCode.OK, schemaRes.StatusCode);
        var schemaBody = await schemaRes.Content.ReadFromJsonAsync<CSharpToJsonSchemaRoslynResponse>();
        Assert.NotNull(schemaBody);
        Assert.True(schemaBody.IsValid);
        Assert.Contains("\"maxLength\": 80", schemaBody.JsonSchema);
        Assert.Contains("\"minLength\": 2", schemaBody.JsonSchema);
    }

    [Fact]
    public async Task Snippets_CreateAndGetShareLink_RoundTripsSuccessfully()
    {
        var createReq = new CreateSnippetRequest(
            Tool: "roslyn-workbench",
            Content: "public record Hello(string Name);",
            Title: "Greeting Record",
            ExpiresInDays: 7
        );

        var postRes = await _client.PostAsJsonAsync("/api/snippets", createReq);
        Assert.Equal(HttpStatusCode.Created, postRes.StatusCode);

        var created = await postRes.Content.ReadFromJsonAsync<SnippetResponse>();
        Assert.NotNull(created);
        Assert.False(string.IsNullOrWhiteSpace(created.Id));

        var getRes = await _client.GetAsync($"/api/snippets/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

        var fetched = await getRes.Content.ReadFromJsonAsync<SnippetResponse>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal("roslyn-workbench", fetched.Tool);
        Assert.Equal("public record Hello(string Name);", fetched.Content);
    }

    [Fact]
    public void SecurityGuard_DevAssistantApiAssembly_NeverCallsAssemblyLoad()
    {
        // Guard required by BACKEND-PLAN.md Phase 2:
        // "Never call Assembly.Load or execute user code. Add a test that guards this."
        var apiAssemblyPath = typeof(Program).Assembly.Location;
        Assert.True(File.Exists(apiAssemblyPath), "DevAssistant.Api assembly file must exist.");

        using var fs = File.OpenRead(apiAssemblyPath);
        using var peReader = new PEReader(fs);
        var metadataReader = peReader.GetMetadataReader();

        var forbiddenMemberReferences = new List<string>();

        foreach (var memberRefHandle in metadataReader.MemberReferences)
        {
            var memberRef = metadataReader.GetMemberReference(memberRefHandle);
            var memberName = metadataReader.GetString(memberRef.Name);

            if (memberRef.Parent.Kind == HandleKind.TypeReference)
            {
                var typeRef = metadataReader.GetTypeReference((TypeReferenceHandle)memberRef.Parent);
                var typeName = metadataReader.GetString(typeRef.Name);
                var typeNamespace = metadataReader.GetString(typeRef.Namespace);

                if (typeNamespace == "System.Reflection" &&
                    typeName == "Assembly" &&
                    memberName.StartsWith("Load", StringComparison.Ordinal))
                {
                    forbiddenMemberReferences.Add($"{typeNamespace}.{typeName}.{memberName}");
                }

                if (typeNamespace == "System.Runtime.Loader" &&
                    typeName == "AssemblyLoadContext" &&
                    memberName.StartsWith("Load", StringComparison.Ordinal))
                {
                    forbiddenMemberReferences.Add($"{typeNamespace}.{typeName}.{memberName}");
                }
            }
        }

        Assert.Empty(forbiddenMemberReferences);
    }
}
