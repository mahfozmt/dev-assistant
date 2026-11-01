using System.Runtime.InteropServices;
using System.Threading.RateLimiting;
using DevAssistant.Api.Data;
using DevAssistant.Api.Endpoints;
using DevAssistant.Api.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Http.Timeouts;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// 1. Logging to file (Serilog) with no request bodies logged
var logDirectory = Path.Combine(builder.Environment.ContentRootPath, "logs");
Directory.CreateDirectory(logDirectory);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        path: Path.Combine(logDirectory, "devassistant-api-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        shared: true,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// 2. 64 KB request size limit
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 64 * 1024; // 64 KB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 64 * 1024;
});

// 3. ProblemDetails errors
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
    };
});

// 4. Request timeouts on every endpoint
builder.Services.AddRequestTimeouts(options =>
{
    options.DefaultPolicy = new RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(10),
        TimeoutStatusCode = StatusCodes.Status504GatewayTimeout
    };
});

// 5. Built-in rate limiter (~30 requests per minute per IP)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            type = "https://httpstatuses.com/429",
            title = "Too Many Requests",
            status = 429,
            detail = "Rate limit exceeded (30 requests per minute per IP). Please wait a moment and try again."
        }, cancellationToken: token);
    };

    options.AddPolicy("PerIpFixed", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

// 6. CORS limited to https://lab.mahfozmt.com (plus localhost in Development)
builder.Services.AddCors(options =>
{
    options.AddPolicy("LabFrontend", policy =>
    {
        var allowedOrigins = builder.Environment.IsDevelopment()
            ? new[] { "https://lab.mahfozmt.com", "http://localhost:4200" }
            : new[] { "https://lab.mahfozmt.com" };

        policy.WithOrigins(allowedOrigins)
            .WithMethods("GET", "POST", "OPTIONS")
            .WithHeaders("Content-Type", "Accept")
            .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});

// 7. OpenAPI document
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "DevAssistant .NET 10 API";
        document.Info.Version = "v1";
        document.Info.Description = "Stateless .NET 10, ScriptDom, Roslyn, and Share Links API for lab.mahfozmt.com.";
        return Task.CompletedTask;
    });
});

// 8. Database (SQL Server when configured, or zero-config SQLite in App_Data)
var dataDir = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(dataDir);

var sqlServerConn = builder.Configuration.GetConnectionString("SqlServer");
var sqliteConn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? $"Data Source={Path.Combine(dataDir, "devassistant.db")}";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(sqlServerConn))
    {
        options.UseSqlServer(sqlServerConn);
    }
    else
    {
        options.UseSqlite(sqliteConn);
    }
});

// 9. Application services
builder.Services.AddSingleton<DotnetToolsService>();
builder.Services.AddSingleton<RoslynService>();
builder.Services.AddHostedService<SnippetCleanupService>();

var app = builder.Build();

// Ensure database schema exists
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

// Enforce 64 KB limit even when hosted behind IIS InProcess/OutOfProcess
app.Use(async (context, next) =>
{
    var maxBodyFeature = context.Features.Get<IHttpMaxRequestBodySizeFeature>();
    if (maxBodyFeature is { IsReadOnly: false })
    {
        maxBodyFeature.MaxRequestBodySize = 64 * 1024;
    }

    if (context.Request.ContentLength is > 64 * 1024)
    {
        context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        await context.Response.WriteAsJsonAsync(new
        {
            type = "https://httpstatuses.com/413",
            title = "Payload Too Large",
            status = 413,
            detail = "Request body exceeds the 64 KB limit."
        });
        return;
    }

    await next();
});

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseCors("LabFrontend");
app.UseRateLimiter();
app.UseRequestTimeouts();

// OpenAPI & Scalar UI
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("DevAssistant API Reference")
           .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

app.MapGet("/", () => Results.Redirect("/scalar/v1"))
   .ExcludeFromDescription();

// Phase 0: Health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "DevAssistant.Api",
    framework = RuntimeInformation.FrameworkDescription,
    os = RuntimeInformation.OSDescription,
    timestamp = DateTimeOffset.UtcNow
}))
.WithTags("Health")
.WithName("GetHealth")
.WithSummary("Health check endpoint for uptime monitoring and CI/CD verification.");

// Phase 1, 2, 3 endpoint groups
app.MapDotnetEndpoints();
app.MapRoslynEndpoints();
app.MapSnippetEndpoints();

app.Run();

public partial class Program;
