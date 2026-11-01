using DevAssistant.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DevAssistant.Api.Endpoints;

public static class RoslynEndpoints
{
    public static RouteGroupBuilder MapRoslynEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/roslyn")
            .WithTags("Roslyn Workbench")
            .RequireRateLimiting("PerIpFixed");

        group.MapPost("/inspect", async ([FromBody] RoslynInspectRequest request, RoslynService service, CancellationToken ct) =>
        {
            var result = await service.InspectCodeAsync(request, ct);
            if (!result.Success && result.Error?.Contains("maximum allowed size") == true)
            {
                return Results.Problem(
                    title: "Code size limit exceeded",
                    detail: result.Error,
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }
            return Results.Ok(result);
        })
        .WithName("InspectCSharpWithRoslyn")
        .WithSummary("Compiles C# in memory (max 20 KB, never executes code) and returns diagnostics, syntax tree, lowered C#, and IL disassembly.");

        group.MapPost("/csharp-to-ts", ([FromBody] CSharpToTsRoslynRequest request, RoslynService service) =>
        {
            var result = service.ConvertCSharpToTypeScript(request);
            return Results.Ok(result);
        })
        .WithName("ConvertCSharpToTypeScriptRoslyn")
        .WithSummary("Converts C# classes, records, structs, interfaces, and enums to TypeScript using Roslyn syntax parsing.");

        group.MapPost("/csharp-to-json-schema", ([FromBody] CSharpToJsonSchemaRoslynRequest request, RoslynService service) =>
        {
            var result = service.ConvertCSharpToJsonSchema(request);
            return Results.Ok(result);
        })
        .WithName("ConvertCSharpToJsonSchemaRoslyn")
        .WithSummary("Generates Draft 2020-12 JSON Schema from C# models and DataAnnotations using Roslyn syntax parsing.");

        return group;
    }
}
