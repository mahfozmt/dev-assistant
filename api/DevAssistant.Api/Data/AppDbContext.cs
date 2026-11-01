using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace DevAssistant.Api.Data;

public class Snippet
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Tool { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Title { get; set; }

    [Required]
    [MaxLength(65536)]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }
}

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Snippet> Snippets => Set<Snippet>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Snippet>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => s.ExpiresAt);
            entity.Property(s => s.Tool).IsRequired().HasMaxLength(64);
            entity.Property(s => s.Content).IsRequired().HasMaxLength(65536);
        });
    }
}
