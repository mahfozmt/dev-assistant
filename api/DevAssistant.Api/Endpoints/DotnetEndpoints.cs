using DevAssistant.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DevAssistant.Api.Endpoints;

public static class DotnetEndpoints
{
    public static RouteGroupBuilder MapDotnetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dotnet")
            .WithTags(".NET Tools")
            .RequireRateLimiting("PerIpFixed");

        group.MapPost("/regex", ([FromBody] RegexTestRequest request, DotnetToolsService service) =>
        {
            var result = service.TestRegex(request);
            return Results.Ok(result);
        })
        .WithName("TestDotnetRegex")
        .WithSummary("Evaluates a .NET regular expression with matchTimeout, all RegexOptions, and balancing group captures.");

        group.MapPost("/tsql", ([FromBody] TSqlAnalyzeRequest request, DotnetToolsService service) =>
        {
            var result = service.AnalyzeTSql(request);
            return Results.Ok(result);
        })
        .WithName("AnalyzeTSql")
        .WithSummary("Parses and formats T-SQL using Microsoft.SqlServer.TransactSql.ScriptDom, returning syntax errors and table references.");

        group.MapPost("/connection-string", ([FromBody] ConnectionStringInspectRequest request, DotnetToolsService service) =>
        {
            var result = service.InspectConnectionString(request);
            return Results.Ok(result);
        })
        .WithName("InspectConnectionString")
        .WithSummary("Parses, explains, and audits SQL Server and PostgreSQL connection strings without making any network connections.");

        group.MapPost("/json-to-csharp", ([FromBody] JsonToCSharpRequest request, DotnetToolsService service) =>
        {
            var result = service.ConvertJsonToCSharp(request);
            return Results.Ok(result);
        })
        .WithName("ConvertJsonToCSharp")
        .WithSummary("Generates C# records or classes with System.Text.Json attributes from a JSON payload.");

        group.MapPost("/format-timezone", ([FromBody] FormatTimezoneRequest request, DotnetToolsService service) =>
        {
            var result = service.TestFormatAndTimeZone(request);
            return Results.Ok(result);
        })
        .WithName("TestFormatAndTimeZone")
        .WithSummary("Tests .NET string formatting across cultures and converts timestamps across Windows and IANA TimeZoneInfo IDs.");

        return group;
    }
}
