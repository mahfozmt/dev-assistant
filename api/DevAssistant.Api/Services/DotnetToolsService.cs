using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.TransactSql.ScriptDom;
using Npgsql;

namespace DevAssistant.Api.Services;

public record RegexTestRequest(
    string Pattern,
    string Input,
    string? Replacement = null,
    string[]? Options = null
);

public record RegexGroupCaptureDto(string Value, int Index, int Length);

public record RegexGroupDto(
    string Name,
    string Value,
    int Index,
    int Length,
    bool Success,
    IReadOnlyList<RegexGroupCaptureDto> Captures
);

public record RegexMatchDto(
    int MatchNumber,
    string Value,
    int Index,
    int Length,
    IReadOnlyList<RegexGroupDto> Groups
);

public record RegexTestResponse(
    bool IsValid,
    string? Error,
    int MatchCount,
    double ElapsedMs,
    string? ReplacedText,
    IReadOnlyList<string> GroupNames,
    IReadOnlyList<RegexMatchDto> Matches
);

public record TSqlAnalyzeRequest(
    string Sql,
    string SqlVersion = "Sql160",
    int IndentationSize = 4,
    string KeywordCasing = "Uppercase",
    bool IncludeSystemObjects = false
);

public record TSqlErrorDto(int Line, int Column, int Number, string Message);

public record TSqlTableReferenceDto(
    string? Server,
    string? Database,
    string Schema,
    string Table,
    string? Alias,
    int StartLine,
    int StartColumn
);

public record TSqlAnalyzeResponse(
    bool IsValid,
    string FormattedSql,
    IReadOnlyList<TSqlErrorDto> Errors,
    IReadOnlyList<TSqlTableReferenceDto> ReferencedTables,
    int StatementCount
);

public record ConnectionStringInspectRequest(
    string ConnectionString,
    string Provider = "auto" // "auto", "sqlserver", "postgres"
);

public record ConnectionSettingDto(
    string Key,
    string Value,
    string Category,
    string Description,
    bool IsSensitive
);

public record ConnectionWarningDto(
    string Severity, // "warning" | "error" | "info"
    string Key,
    string Message,
    string Recommendation
);

public record ConnectionStringInspectResponse(
    bool IsValid,
    string DetectedProvider,
    string NormalizedConnectionString,
    string RedactedConnectionString,
    string? Error,
    IReadOnlyList<ConnectionSettingDto> Settings,
    IReadOnlyList<ConnectionWarningDto> Warnings
);

public record JsonToCSharpRequest(
    string Json,
    string RootTypeName = "RootObject",
    string Namespace = "DevAssistant.Models",
    bool UseRecords = true,
    bool UseSystemTextJsonAttributes = true,
    bool UseNullableReferenceTypes = true,
    bool UsePascalCase = true
);

public record JsonToCSharpResponse(
    bool IsValid,
    string Code,
    string? Error,
    int GeneratedTypeCount
);

public record FormatTimezoneRequest(
    string? RawValue = "1234567.89",
    string ValueType = "number", // "number" | "datetime"
    string FormatString = "C2",
    string[]? Cultures = null,
    string? TimestampIso = null,
    string SourceTimeZone = "UTC",
    string[]? TargetTimeZones = null
);

public record CultureFormatResultDto(
    string Culture,
    string DisplayName,
    string FormattedOutput,
    string? Error
);

public record TimeZoneConversionDto(
    string RequestedId,
    string ResolvedId,
    string? IanaId,
    string? WindowsId,
    string DisplayName,
    string ConvertedIso,
    string FormattedLocal,
    string UtcOffset,
    bool IsDaylightSavingTime,
    string? Error
);

public record FormatTimezoneResponse(
    bool IsValid,
    string? Error,
    IReadOnlyList<CultureFormatResultDto> CultureResults,
    IReadOnlyList<TimeZoneConversionDto> TimeZoneResults
);

public class DotnetToolsService
{
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(2);

    public RegexTestResponse TestRegex(RegexTestRequest request)
    {
        if (string.IsNullOrEmpty(request.Pattern))
        {
            return new RegexTestResponse(true, null, 0, 0, request.Input, [], []);
        }

        var options = ParseRegexOptions(request.Options);
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var regex = new Regex(request.Pattern, options, RegexTimeout);
            var groupNames = regex.GetGroupNames().ToList();
            var matches = new List<RegexMatchDto>();

            var matchCollection = regex.Matches(request.Input ?? string.Empty);
            int idx = 0;
            foreach (Match m in matchCollection)
            {
                idx++;
                if (idx > 500) break;

                var groups = new List<RegexGroupDto>();
                for (int gIdx = 0; gIdx < m.Groups.Count; gIdx++)
                {
                    var g = m.Groups[gIdx];
                    var name = regex.GroupNameFromNumber(gIdx);
                    var captures = new List<RegexGroupCaptureDto>();
                    foreach (Capture c in g.Captures)
                    {
                        captures.Add(new RegexGroupCaptureDto(c.Value, c.Index, c.Length));
                    }
                    groups.Add(new RegexGroupDto(name, g.Value, g.Index, g.Length, g.Success, captures));
                }

                matches.Add(new RegexMatchDto(idx, m.Value, m.Index, m.Length, groups));
            }

            string? replaced = null;
            if (request.Replacement is not null)
            {
                replaced = regex.Replace(request.Input ?? string.Empty, request.Replacement);
            }

            sw.Stop();
            return new RegexTestResponse(
                true,
                null,
                matches.Count,
                Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                replaced,
                groupNames,
                matches
            );
        }
        catch (RegexMatchTimeoutException)
        {
            sw.Stop();
            return new RegexTestResponse(
                false,
                $"Regex evaluation timed out after {RegexTimeout.TotalSeconds:0.#} seconds (catastrophic backtracking guard).",
                0,
                Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                null,
                [],
                []
            );
        }
        catch (ArgumentException ex)
        {
            sw.Stop();
            return new RegexTestResponse(
                false,
                ex.Message,
                0,
                Math.Round(sw.Elapsed.TotalMilliseconds, 3),
                null,
                [],
                []
            );
        }
    }

    private static RegexOptions ParseRegexOptions(string[]? optionNames)
    {
        if (optionNames is null || optionNames.Length == 0)
        {
            return RegexOptions.None;
        }

        RegexOptions result = RegexOptions.None;
        foreach (var raw in optionNames)
        {
            switch (raw.Trim().ToLowerInvariant())
            {
                case "ignorecase":
                case "i":
                    result |= RegexOptions.IgnoreCase;
                    break;
                case "multiline":
                case "m":
                    result |= RegexOptions.Multiline;
                    break;
                case "singleline":
                case "s":
                    result |= RegexOptions.Singleline;
                    break;
                case "explicitcapture":
                case "n":
                    result |= RegexOptions.ExplicitCapture;
                    break;
                case "ignorepatternwhitespace":
                case "x":
                    result |= RegexOptions.IgnorePatternWhitespace;
                    break;
                case "righttoleft":
                case "r":
                    result |= RegexOptions.RightToLeft;
                    break;
                case "ecmascript":
                    result |= RegexOptions.ECMAScript;
                    break;
                case "cultureinvariant":
                    result |= RegexOptions.CultureInvariant;
                    break;
                case "nonbacktracking":
                    result |= RegexOptions.NonBacktracking;
                    break;
            }
        }

        // NonBacktracking cannot be combined with RightToLeft or ECMAScript
        if (result.HasFlag(RegexOptions.NonBacktracking))
        {
            result &= ~(RegexOptions.RightToLeft | RegexOptions.ECMAScript);
        }

        return result;
    }

    public TSqlAnalyzeResponse AnalyzeTSql(TSqlAnalyzeRequest request)
    {
        var sql = request.Sql ?? string.Empty;
        if (string.IsNullOrWhiteSpace(sql))
        {
            return new TSqlAnalyzeResponse(true, string.Empty, [], [], 0);
        }

        TSqlParser parser = request.SqlVersion?.ToLowerInvariant() switch
        {
            "sql150" => new TSql150Parser(true, SqlEngineType.All),
            "sql140" => new TSql140Parser(true, SqlEngineType.All),
            _ => new TSql160Parser(true, SqlEngineType.All)
        };

        using var reader = new StringReader(sql);
        var fragment = parser.Parse(reader, out var parseErrors);

        var errors = parseErrors
            .Select(e => new TSqlErrorDto(e.Line, e.Column, e.Number, e.Message))
            .ToList();

        var visitor = new TableReferenceVisitor();
        fragment.Accept(visitor);

        string formattedSql = sql;
        if (errors.Count == 0 && fragment is not null)
        {
            var genOptions = new SqlScriptGeneratorOptions
            {
                IndentationSize = Math.Clamp(request.IndentationSize, 2, 8),
                KeywordCasing = request.KeywordCasing?.ToLowerInvariant() switch
                {
                    "lowercase" => KeywordCasing.Lowercase,
                    "pascalcase" => KeywordCasing.PascalCase,
                    _ => KeywordCasing.Uppercase
                },
                AlignClauseBodies = false,
                MultilineSelectElementsList = true,
                MultilineWherePredicatesList = true,
                NewLineBeforeFromClause = true,
                NewLineBeforeWhereClause = true,
                NewLineBeforeGroupByClause = true,
                NewLineBeforeOrderByClause = true,
                NewLineBeforeJoinClause = true
            };

            SqlScriptGenerator generator = new Sql160ScriptGenerator(genOptions);
            generator.GenerateScript(fragment, out formattedSql);
        }

        int statementCount = (fragment as TSqlScript)?.Batches.Sum(b => b.Statements.Count) ?? 0;

        return new TSqlAnalyzeResponse(
            errors.Count == 0,
            formattedSql,
            errors,
            visitor.Tables,
            statementCount
        );
    }

    private sealed class TableReferenceVisitor : TSqlFragmentVisitor
    {
        public List<TSqlTableReferenceDto> Tables { get; } = [];

        public override void ExplicitVisit(NamedTableReference node)
        {
            var schemaObj = node.SchemaObject;
            var table = schemaObj?.BaseIdentifier?.Value ?? string.Empty;
            var schema = schemaObj?.SchemaIdentifier?.Value ?? "dbo";
            var db = schemaObj?.DatabaseIdentifier?.Value;
            var server = schemaObj?.ServerIdentifier?.Value;
            var alias = node.Alias?.Value;

            if (!string.IsNullOrEmpty(table))
            {
                Tables.Add(new TSqlTableReferenceDto(
                    server,
                    db,
                    schema,
                    table,
                    alias,
                    node.StartLine,
                    node.StartColumn
                ));
            }

            base.ExplicitVisit(node);
        }
    }

    public ConnectionStringInspectResponse InspectConnectionString(ConnectionStringInspectRequest request)
    {
        var raw = request.ConnectionString?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return new ConnectionStringInspectResponse(
                false,
                "unknown",
                string.Empty,
                string.Empty,
                "Connection string is empty.",
                [],
                []
            );
        }

        var provider = DetectProvider(raw, request.Provider);
        return provider == "postgres"
            ? InspectPostgres(raw)
            : InspectSqlServer(raw);
    }

    private static string DetectProvider(string raw, string? requested)
    {
        var req = requested?.Trim().ToLowerInvariant();
        if (req is "postgres" or "postgresql" or "npgsql") return "postgres";
        if (req is "sqlserver" or "mssql") return "sqlserver";

        var lower = raw.ToLowerInvariant();
        if (lower.Contains("host=") || lower.Contains("username=") || lower.Contains("ssl mode=") || lower.Contains("sslmode=") || lower.Contains("search path="))
        {
            return "postgres";
        }
        return "sqlserver";
    }

    private static ConnectionStringInspectResponse InspectSqlServer(string raw)
    {
        try
        {
            var builder = new SqlConnectionStringBuilder(raw);
            var settings = new List<ConnectionSettingDto>();
            var warnings = new List<ConnectionWarningDto>();

            if (!string.IsNullOrWhiteSpace(builder.DataSource))
            {
                settings.Add(new("Data Source", builder.DataSource, "Server", "SQL Server instance hostname, IP, or port.", false));
            }
            else
            {
                warnings.Add(new("error", "Data Source", "Missing Data Source / Server name.", "Specify 'Server=myserver.database.windows.net;' or 'Data Source=localhost;'."));
            }

            if (!string.IsNullOrWhiteSpace(builder.InitialCatalog))
            {
                settings.Add(new("Initial Catalog", builder.InitialCatalog, "Database", "Default database to connect to.", false));
            }
            else
            {
                warnings.Add(new("info", "Initial Catalog", "No Initial Catalog (Database) specified.", "Add 'Database=MyDb;' so queries do not default to 'master'."));
            }

            settings.Add(new("Integrated Security", builder.IntegratedSecurity.ToString(), "Authentication", "Uses Windows / Active Directory integrated authentication when true.", false));

            if (!string.IsNullOrEmpty(builder.UserID))
            {
                settings.Add(new("User ID", builder.UserID, "Authentication", "SQL Server login username.", false));
            }

            if (!string.IsNullOrEmpty(builder.Password))
            {
                settings.Add(new("Password", "********", "Authentication", "SQL authentication password (redacted).", true));
                warnings.Add(new("warning", "Password", "Plaintext SQL credentials detected in connection string.", "Prefer Managed Identity, Azure AD authentication, or Integrated Security in production, and store secrets in a vault or environment variables."));
            }

            settings.Add(new("Encrypt", builder.Encrypt.ToString(), "Security", "Controls TLS encryption for all data sent between client and server.", false));
            settings.Add(new("TrustServerCertificate", builder.TrustServerCertificate.ToString(), "Security", "When true, bypasses TLS certificate chain validation.", false));

            if (builder.TrustServerCertificate)
            {
                warnings.Add(new("warning", "TrustServerCertificate", "TrustServerCertificate=True disables SSL/TLS certificate validation and exposes connections to man-in-the-middle (MITM) attacks.", "Set TrustServerCertificate=False in production and install a valid CA-signed certificate on SQL Server."));
            }

            if (builder.Encrypt == SqlConnectionEncryptOption.Optional || builder.Encrypt.ToString().Equals("False", StringComparison.OrdinalIgnoreCase))
            {
                warnings.Add(new("warning", "Encrypt", "TLS encryption is disabled or optional (Encrypt=False).", "Set Encrypt=True (or Mandatory/Strict in SqlClient v5+) to encrypt data in transit."));
            }

            settings.Add(new("Pooling", builder.Pooling.ToString(), "Pooling", "Enables connection pooling for performance.", false));
            if (!builder.Pooling)
            {
                warnings.Add(new("warning", "Pooling", "Connection pooling is disabled (Pooling=False).", "Keep Pooling=True unless diagnosing a specific pooling issue."));
            }
            else
            {
                settings.Add(new("Min Pool Size", builder.MinPoolSize.ToString(), "Pooling", "Minimum number of connections maintained in the pool.", false));
                settings.Add(new("Max Pool Size", builder.MaxPoolSize.ToString(), "Pooling", "Maximum number of connections allowed in the pool.", false));
            }

            settings.Add(new("Connect Timeout", $"{builder.ConnectTimeout}s", "Timeouts", "Seconds to wait for a connection to open before failing.", false));
            if (builder.ConnectTimeout > 60)
            {
                warnings.Add(new("info", "Connect Timeout", $"Connect Timeout ({builder.ConnectTimeout}s) is unusually high.", "Use 15-30 seconds so unhealthy database nodes fail fast."));
            }

            settings.Add(new("MultipleActiveResultSets", builder.MultipleActiveResultSets.ToString(), "Behavior", "Allows interleaving multiple active readers on a single connection (MARS).", false));

            if (string.IsNullOrWhiteSpace(builder.ApplicationName) || builder.ApplicationName == "Core Microsoft SqlClient Data Provider")
            {
                warnings.Add(new("info", "Application Name", "No custom Application Name specified.", "Add 'Application Name=MyService;' to identify this app in SQL Server DMVs (sys.dm_exec_sessions) and traces."));
            }
            else
            {
                settings.Add(new("Application Name", builder.ApplicationName, "Diagnostics", "Client application name visible in SQL Server activity monitor.", false));
            }

            var redactedBuilder = new SqlConnectionStringBuilder(builder.ConnectionString);
            if (!string.IsNullOrEmpty(redactedBuilder.Password))
            {
                redactedBuilder.Password = "********";
            }

            return new ConnectionStringInspectResponse(
                true,
                "sqlserver",
                builder.ConnectionString,
                redactedBuilder.ConnectionString,
                null,
                settings,
                warnings
            );
        }
        catch (Exception ex)
        {
            return new ConnectionStringInspectResponse(
                false,
                "sqlserver",
                raw,
                raw,
                ex.Message,
                [],
                [new("error", "Syntax", ex.Message, "Verify key=value pairs are separated by semicolons and contain valid SqlClient keywords.")]
            );
        }
    }

    private static ConnectionStringInspectResponse InspectPostgres(string raw)
    {
        try
        {
            var builder = new NpgsqlConnectionStringBuilder(raw);
            var settings = new List<ConnectionSettingDto>();
            var warnings = new List<ConnectionWarningDto>();

            if (!string.IsNullOrWhiteSpace(builder.Host))
            {
                settings.Add(new("Host", builder.Host, "Server", "PostgreSQL server hostname or IP address.", false));
            }
            else
            {
                warnings.Add(new("error", "Host", "Missing Host in PostgreSQL connection string.", "Specify 'Host=localhost;' or 'Host=db.example.com;'."));
            }

            settings.Add(new("Port", builder.Port.ToString(), "Server", "TCP port on which PostgreSQL listens (default 5432).", false));

            if (!string.IsNullOrWhiteSpace(builder.Database))
            {
                settings.Add(new("Database", builder.Database, "Database", "PostgreSQL database name.", false));
            }

            if (!string.IsNullOrWhiteSpace(builder.Username))
            {
                settings.Add(new("Username", builder.Username, "Authentication", "PostgreSQL role/user name.", false));
            }

            if (!string.IsNullOrEmpty(builder.Password))
            {
                settings.Add(new("Password", "********", "Authentication", "PostgreSQL password (redacted).", true));
                warnings.Add(new("warning", "Password", "Plaintext password found in connection string.", "Store database credentials in secret management or environment variables, never in source control."));
            }

            settings.Add(new("SslMode", builder.SslMode.ToString(), "Security", "Controls SSL/TLS encryption and certificate verification.", false));
            if (builder.SslMode is SslMode.Disable or SslMode.Allow or SslMode.Prefer)
            {
                warnings.Add(new("warning", "SslMode", $"SslMode={builder.SslMode} does not enforce encrypted & verified TLS connections.", "Use 'Ssl Mode=VerifyFull;' (or 'Require') in production environments."));
            }

            settings.Add(new("Pooling", builder.Pooling.ToString(), "Pooling", "Enables Npgsql internal connection pooling.", false));
            settings.Add(new("MinPoolSize", builder.MinPoolSize.ToString(), "Pooling", "Minimum connections kept in the pool.", false));
            settings.Add(new("MaxPoolSize", builder.MaxPoolSize.ToString(), "Pooling", "Maximum connections allowed in the pool.", false));
            settings.Add(new("Timeout", $"{builder.Timeout}s", "Timeouts", "Connection open timeout in seconds.", false));
            settings.Add(new("CommandTimeout", $"{builder.CommandTimeout}s", "Timeouts", "Default SQL command execution timeout in seconds.", false));

            if (string.IsNullOrWhiteSpace(builder.ApplicationName))
            {
                warnings.Add(new("info", "Application Name", "Application Name is not set.", "Add 'Application Name=MyService;' so connections are identifiable in pg_stat_activity."));
            }
            else
            {
                settings.Add(new("Application Name", builder.ApplicationName, "Diagnostics", "Reported in pg_stat_activity.application_name.", false));
            }

            var redactedBuilder = new NpgsqlConnectionStringBuilder(builder.ConnectionString);
            if (!string.IsNullOrEmpty(redactedBuilder.Password))
            {
                redactedBuilder.Password = "********";
            }

            return new ConnectionStringInspectResponse(
                true,
                "postgres",
                builder.ConnectionString,
                redactedBuilder.ConnectionString,
                null,
                settings,
                warnings
            );
        }
        catch (Exception ex)
        {
            return new ConnectionStringInspectResponse(
                false,
                "postgres",
                raw,
                raw,
                ex.Message,
                [],
                [new("error", "Syntax", ex.Message, "Verify key=value pairs use valid Npgsql connection string keywords.")]
            );
        }
    }

    public JsonToCSharpResponse ConvertJsonToCSharp(JsonToCSharpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Json))
        {
            return new JsonToCSharpResponse(false, string.Empty, "JSON input is empty.", 0);
        }

        try
        {
            using var doc = JsonDocument.Parse(request.Json, new JsonDocumentOptions
            {
                AllowTrailingCommas = true,
                CommentHandling = JsonCommentHandling.Skip
            });

            var rootElement = doc.RootElement;
            if (rootElement.ValueKind == JsonValueKind.Array)
            {
                var firstObj = rootElement.EnumerateArray().FirstOrDefault(e => e.ValueKind == JsonValueKind.Object);
                if (firstObj.ValueKind == JsonValueKind.Object)
                {
                    rootElement = firstObj;
                }
                else
                {
                    return new JsonToCSharpResponse(false, string.Empty, "Root JSON must be an object or an array of objects.", 0);
                }
            }
            else if (rootElement.ValueKind != JsonValueKind.Object)
            {
                return new JsonToCSharpResponse(false, string.Empty, "Root JSON element must be a JSON object.", 0);
            }

            var typeDefinitions = new List<(string Name, string Code)>();
            var visitedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var rootName = SanitizeIdentifier(string.IsNullOrWhiteSpace(request.RootTypeName) ? "RootObject" : request.RootTypeName, true);

            GenerateTypeFromJsonObject(rootName, rootElement, request, typeDefinitions, visitedNames);

            var sb = new StringBuilder();
            if (request.UseNullableReferenceTypes)
            {
                sb.AppendLine("#nullable enable");
                sb.AppendLine();
            }
            if (request.UseSystemTextJsonAttributes)
            {
                sb.AppendLine("using System.Text.Json.Serialization;");
                sb.AppendLine();
            }
            if (!string.IsNullOrWhiteSpace(request.Namespace))
            {
                sb.AppendLine($"namespace {request.Namespace.Trim()};");
                sb.AppendLine();
            }

            // Root type first, then nested types
            typeDefinitions.Reverse();
            for (int i = 0; i < typeDefinitions.Count; i++)
            {
                sb.Append(typeDefinitions[i].Code);
                if (i < typeDefinitions.Count - 1)
                {
                    sb.AppendLine();
                }
            }

            return new JsonToCSharpResponse(true, sb.ToString().TrimEnd(), null, typeDefinitions.Count);
        }
        catch (JsonException ex)
        {
            return new JsonToCSharpResponse(false, string.Empty, $"Invalid JSON at line {(ex.LineNumber ?? 0) + 1}: {ex.Message}", 0);
        }
    }

    private void GenerateTypeFromJsonObject(
        string typeName,
        JsonElement obj,
        JsonToCSharpRequest options,
        List<(string Name, string Code)> output,
        HashSet<string> visitedNames)
    {
        var sb = new StringBuilder();
        var keyword = options.UseRecords ? "public sealed record" : "public sealed class";
        sb.AppendLine($"{keyword} {typeName}");
        sb.AppendLine("{");

        foreach (var prop in obj.EnumerateObject())
        {
            var rawName = prop.Name;
            var csharpPropName = options.UsePascalCase ? SanitizeIdentifier(rawName, true) : SanitizeIdentifier(rawName, false);
            if (string.Equals(csharpPropName, typeName, StringComparison.Ordinal))
            {
                csharpPropName += "Value";
            }

            var csharpType = InferCSharpType(csharpPropName, prop.Value, options, output, visitedNames);

            if (options.UseSystemTextJsonAttributes)
            {
                sb.AppendLine($"    [JsonPropertyName(\"{EscapeString(rawName)}\")]");
            }

            var accessor = options.UseRecords ? "{ get; init; }" : "{ get; set; }";
            var defaultInitializer = (!options.UseNullableReferenceTypes || csharpType.EndsWith('?'))
                ? string.Empty
                : csharpType == "string"
                    ? " = string.Empty;"
                    : csharpType.StartsWith("IReadOnlyList<", StringComparison.Ordinal)
                        ? " = [];"
                        : string.Empty;

            sb.AppendLine($"    public {csharpType} {csharpPropName} {accessor}{defaultInitializer}");
            sb.AppendLine();
        }

        if (sb.Length >= 2 && sb[^1] == '\n' && sb[^2] == '\n')
        {
            sb.Length -= Environment.NewLine.Length;
        }

        sb.AppendLine("}");
        output.Add((typeName, sb.ToString()));
    }

    private string InferCSharpType(
        string propName,
        JsonElement element,
        JsonToCSharpRequest options,
        List<(string Name, string Code)> output,
        HashSet<string> visitedNames)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                var s = element.GetString() ?? string.Empty;
                if (Guid.TryParse(s, out _)) return "Guid";
                if (DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _) && s.Contains('-') && s.Length >= 10)
                    return "DateTimeOffset";
                return "string";

            case JsonValueKind.Number:
                if (element.TryGetInt32(out _)) return "int";
                if (element.TryGetInt64(out _)) return "long";
                if (element.TryGetDecimal(out _)) return "decimal";
                return "double";

            case JsonValueKind.True:
            case JsonValueKind.False:
                return "bool";

            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
                return options.UseNullableReferenceTypes ? "object?" : "object";

            case JsonValueKind.Object:
                var nestedName = GetUniqueTypeName(Singularize(propName), visitedNames);
                GenerateTypeFromJsonObject(nestedName, element, options, output, visitedNames);
                return options.UseNullableReferenceTypes ? $"{nestedName}?" : nestedName;

            case JsonValueKind.Array:
                var firstNonNull = element.EnumerateArray().FirstOrDefault(e => e.ValueKind != JsonValueKind.Null);
                if (firstNonNull.ValueKind == JsonValueKind.Undefined)
                {
                    return "IReadOnlyList<object>";
                }
                var itemType = InferCSharpType(Singularize(propName), firstNonNull, options, output, visitedNames).TrimEnd('?');
                return $"IReadOnlyList<{itemType}>";

            default:
                return "object";
        }
    }

    private static string GetUniqueTypeName(string baseName, HashSet<string> visitedNames)
    {
        var candidate = SanitizeIdentifier(baseName, true);
        if (visitedNames.Add(candidate))
        {
            return candidate;
        }
        int suffix = 2;
        while (!visitedNames.Add($"{candidate}{suffix}"))
        {
            suffix++;
        }
        return $"{candidate}{suffix}";
    }

    private static string Singularize(string name)
    {
        if (name.EndsWith("ies", StringComparison.OrdinalIgnoreCase) && name.Length > 3)
            return name[..^3] + "y";
        if (name.EndsWith("ses", StringComparison.OrdinalIgnoreCase) && name.Length > 3)
            return name[..^2];
        if (name.EndsWith('s') && !name.EndsWith("ss", StringComparison.OrdinalIgnoreCase) && name.Length > 1)
            return name[..^1];
        return name + "Item";
    }

    private static string SanitizeIdentifier(string raw, bool pascalCase)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "Property";
        var parts = Regex.Split(raw, @"[^a-zA-Z0-9]+").Where(p => p.Length > 0).ToArray();
        if (parts.Length == 0) return "Property";

        var sb = new StringBuilder();
        for (int i = 0; i < parts.Length; i++)
        {
            var p = parts[i];
            if (i == 0 && !pascalCase)
            {
                sb.Append(char.ToLowerInvariant(p[0]));
                if (p.Length > 1) sb.Append(p[1..]);
            }
            else
            {
                sb.Append(char.ToUpperInvariant(p[0]));
                if (p.Length > 1) sb.Append(p[1..]);
            }
        }

        if (char.IsDigit(sb[0]))
        {
            sb.Insert(0, '_');
        }

        return sb.ToString();
    }

    private static string EscapeString(string s) => s.Replace("\\", "\\\\").Replace("\"", "\\\"");

    public FormatTimezoneResponse TestFormatAndTimeZone(FormatTimezoneRequest request)
    {
        var cultures = (request.Cultures is { Length: > 0 }
            ? request.Cultures
            : ["en-US", "en-GB", "bn-BD", "de-DE", "fr-FR", "ja-JP", "ar-SA", "invariant"])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToArray();

        var formatString = string.IsNullOrWhiteSpace(request.FormatString) ? "G" : request.FormatString.Trim();
        var valueType = request.ValueType?.Trim().ToLowerInvariant() ?? "number";
        var cultureResults = new List<CultureFormatResultDto>();

        IFormattable? formattableValue = null;
        if (valueType == "datetime")
        {
            if (DateTimeOffset.TryParse(request.RawValue, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dto))
            {
                formattableValue = dto;
            }
            else
            {
                formattableValue = DateTimeOffset.UtcNow;
            }
        }
        else
        {
            if (decimal.TryParse(request.RawValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var dec))
            {
                formattableValue = dec;
            }
            else if (double.TryParse(request.RawValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var dbl))
            {
                formattableValue = dbl;
            }
            else
            {
                return new FormatTimezoneResponse(false, $"Could not parse '{request.RawValue}' as a valid {valueType}.", [], []);
            }
        }

        foreach (var cultureCode in cultures)
        {
            try
            {
                var culture = string.Equals(cultureCode, "invariant", StringComparison.OrdinalIgnoreCase)
                    ? CultureInfo.InvariantCulture
                    : CultureInfo.GetCultureInfo(cultureCode);

                var displayName = culture == CultureInfo.InvariantCulture ? "Invariant Culture" : culture.EnglishName;
                var formatted = formattableValue.ToString(formatString, culture);
                cultureResults.Add(new CultureFormatResultDto(cultureCode, displayName, formatted, null));
            }
            catch (Exception ex)
            {
                cultureResults.Add(new CultureFormatResultDto(cultureCode, cultureCode, string.Empty, ex.Message));
            }
        }

        var targetTimeZones = (request.TargetTimeZones is { Length: > 0 }
            ? request.TargetTimeZones
            : ["UTC", "Asia/Dhaka", "Bangladesh Standard Time", "America/New_York", "Europe/London", "Asia/Tokyo"])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToArray();

        DateTimeOffset baseTimestamp;
        if (!string.IsNullOrWhiteSpace(request.TimestampIso) &&
            DateTimeOffset.TryParse(request.TimestampIso, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedTs))
        {
            baseTimestamp = parsedTs;
        }
        else if (formattableValue is DateTimeOffset dtoVal)
        {
            baseTimestamp = dtoVal;
        }
        else
        {
            baseTimestamp = DateTimeOffset.UtcNow;
        }

        if (!string.IsNullOrWhiteSpace(request.SourceTimeZone) &&
            TimeZoneInfo.TryFindSystemTimeZoneById(request.SourceTimeZone.Trim(), out var sourceTz) &&
            (request.TimestampIso is null || (!request.TimestampIso.EndsWith('Z') && !request.TimestampIso.Contains('+'))))
        {
            var unspecified = DateTime.SpecifyKind(baseTimestamp.DateTime, DateTimeKind.Unspecified);
            var offset = sourceTz.GetUtcOffset(unspecified);
            baseTimestamp = new DateTimeOffset(unspecified, offset);
        }

        var tzResults = new List<TimeZoneConversionDto>();
        foreach (var tzId in targetTimeZones)
        {
            if (TimeZoneInfo.TryFindSystemTimeZoneById(tzId.Trim(), out var tz))
            {
                var converted = TimeZoneInfo.ConvertTime(baseTimestamp, tz);
                string? ianaId = null;
                string? windowsId = null;

                if (tz.HasIanaId)
                {
                    ianaId = tz.Id;
                    TimeZoneInfo.TryConvertIanaIdToWindowsId(tz.Id, out windowsId);
                }
                else
                {
                    windowsId = tz.Id;
                    TimeZoneInfo.TryConvertWindowsIdToIanaId(tz.Id, out ianaId);
                }

                var offset = tz.GetUtcOffset(converted);
                var sign = offset >= TimeSpan.Zero ? "+" : "-";
                var offsetStr = $"UTC{sign}{offset:hh\\:mm}";

                tzResults.Add(new TimeZoneConversionDto(
                    tzId,
                    tz.Id,
                    ianaId,
                    windowsId,
                    tz.DisplayName,
                    converted.ToString("O", CultureInfo.InvariantCulture),
                    converted.ToString("yyyy-MM-dd HH:mm:ss zzz", CultureInfo.InvariantCulture),
                    offsetStr,
                    tz.IsDaylightSavingTime(converted),
                    null
                ));
            }
            else
            {
                tzResults.Add(new TimeZoneConversionDto(
                    tzId,
                    tzId,
                    null,
                    null,
                    tzId,
                    string.Empty,
                    string.Empty,
                    string.Empty,
                    false,
                    $"TimeZone '{tzId}' was not found on this .NET runtime."
                ));
            }
        }

        return new FormatTimezoneResponse(true, null, cultureResults, tzResults);
    }
}
