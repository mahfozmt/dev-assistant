using System.Security.Cryptography;
using DevAssistant.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevAssistant.Api.Endpoints;

public record CreateSnippetRequest(
    string Tool,
    string Content,
    string? Title = null,
    int ExpiresInDays = 7 // 7 or 30
);

public record SnippetResponse(
    string Id,
    string Tool,
    string? Title,
    string Content,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt
);

public static class SnippetEndpoints
{
    public static RouteGroupBuilder MapSnippetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/snippets")
            .WithTags("Share Links")
            .RequireRateLimiting("PerIpFixed");

        group.MapPost("/", async ([FromBody] CreateSnippetRequest request, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(request.Tool))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["tool"] = ["Tool identifier is required."]
                });
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["content"] = ["Snippet content cannot be empty."]
                });
            }

            if (request.Content.Length > 60_000)
            {
                return Results.Problem(
                    title: "Snippet too large",
                    detail: "Snippet content must not exceed 60 KB.",
                    statusCode: StatusCodes.Status413PayloadTooLarge);
            }

            int days = request.ExpiresInDays == 30 ? 30 : 7;
            var now = DateTime.UtcNow;
            var id = GenerateShortId(10);

            var snippet = new Snippet
            {
                Id = id,
                Tool = request.Tool.Trim(),
                Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim()[..Math.Min(120, request.Title.Trim().Length)],
                Content = request.Content,
                CreatedAt = now,
                ExpiresAt = now.AddDays(days)
            };

            db.Snippets.Add(snippet);
            await db.SaveChangesAsync(ct);

            var dto = new SnippetResponse(
                snippet.Id,
                snippet.Tool,
                snippet.Title,
                snippet.Content,
                new DateTimeOffset(DateTime.SpecifyKind(snippet.CreatedAt, DateTimeKind.Utc)),
                new DateTimeOffset(DateTime.SpecifyKind(snippet.ExpiresAt, DateTimeKind.Utc))
            );

            return Results.Created($"/api/snippets/{snippet.Id}", dto);
        })
        .WithName("CreateSnippet")
        .WithSummary("Creates an anonymous expiring share link (7 or 30 days) for a tool state or snippet.");

        group.MapGet("/{id}", async (string id, AppDbContext db, CancellationToken ct) =>
        {
            var now = DateTime.UtcNow;
            var snippet = await db.Snippets
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id && s.ExpiresAt > now, ct);

            if (snippet is null)
            {
                return Results.Problem(
                    title: "Snippet not found or expired",
                    detail: $"No active shared snippet exists with ID '{id}'.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            return Results.Ok(new SnippetResponse(
                snippet.Id,
                snippet.Tool,
                snippet.Title,
                snippet.Content,
                new DateTimeOffset(DateTime.SpecifyKind(snippet.CreatedAt, DateTimeKind.Utc)),
                new DateTimeOffset(DateTime.SpecifyKind(snippet.ExpiresAt, DateTimeKind.Utc))
            ));
        })
        .WithName("GetSnippetById")
        .WithSummary("Retrieves a shared snippet by ID if it has not expired.");

        return group;
    }

    private static string GenerateShortId(int length)
    {
        const string alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        Span<char> chars = stackalloc char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
        }
        return new string(chars);
    }
}
