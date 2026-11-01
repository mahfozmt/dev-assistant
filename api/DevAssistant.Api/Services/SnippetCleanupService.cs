using DevAssistant.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace DevAssistant.Api.Services;

public class SnippetCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<SnippetCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredSnippetsAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error while cleaning up expired snippets.");
            }

            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    public async Task<int> CleanupExpiredSnippetsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        var expired = await db.Snippets
            .Where(s => s.ExpiresAt <= now)
            .ToListAsync(cancellationToken);

        if (expired.Count > 0)
        {
            db.Snippets.RemoveRange(expired);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Purged {Count} expired snippets.", expired.Count);
        }

        return expired.Count;
    }
}
