using System.Reflection.PortableExecutable;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using ICSharpCode.Decompiler;
using ICSharpCode.Decompiler.CSharp;
using ICSharpCode.Decompiler.Disassembler;
using ICSharpCode.Decompiler.Metadata;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace DevAssistant.Api.Services;

public record RoslynInspectRequest(
    string Code,
    string OptimizationLevel = "Release", // "Debug" | "Release"
    int MaxSyntaxTreeDepth = 5
);

public record RoslynDiagnosticDto(
    string Id,
    string Severity,
    string Message,
    int Line,
    int Column
);

public record RoslynSyntaxNodeDto(
    string Kind,
    string Span,
    string? Identifier,
    IReadOnlyList<RoslynSyntaxNodeDto> Children
);

public record RoslynInspectResponse(
    bool Success,
    string? Error,
    double ElapsedMs,
    IReadOnlyList<RoslynDiagnosticDto> Diagnostics,
    RoslynSyntaxNodeDto? SyntaxTree,
    string LoweredCSharp,
    string IlCode
);

public record CSharpToTsRoslynRequest(
    string Code,
    bool UseTypeInsteadOfInterface = false,
    bool CamelCaseProperties = true,
    bool ExportKeywords = true,
    string DateMapping = "string" // "string" | "Date"
);

public record CSharpToTsRoslynResponse(
    bool IsValid,
    string TypeScriptCode,
    int TypeCount,
    IReadOnlyList<RoslynDiagnosticDto> Diagnostics
);

public record CSharpToJsonSchemaRoslynRequest(
    string Code,
    string? RootTypeName = null,
    bool CamelCaseProperties = true,
    bool AdditionalPropertiesFalse = true
);

public record CSharpToJsonSchemaRoslynResponse(
    bool IsValid,
    string JsonSchema,
    string? RootType,
    IReadOnlyList<RoslynDiagnosticDto> Diagnostics
);

public class RoslynService
{
    public const int MaxCodeLengthBytes = 20 * 1024; // 20 KB limit per BACKEND-PLAN.md
    private static readonly SemaphoreSlim CompileSemaphore = new(2, 2);
    private static readonly Lazy<IReadOnlyList<MetadataReference>> CoreReferences = new(LoadCoreMetadataReferences);

    private static IReadOnlyList<MetadataReference> LoadCoreMetadataReferences()
    {
        var refs = new List<MetadataReference>();
        var tpa = AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") as string;
        if (!string.IsNullOrEmpty(tpa))
        {
            var neededPrefixes = new[]
            {
                "System.Private.CoreLib",
                "System.Runtime",
                "System.Console",
                "System.Collections",
                "System.Linq",
                "System.Text.Json",
                "System.Text.RegularExpressions",
                "System.ComponentModel.Annotations",
                "System.ComponentModel.Primitives",
                "System.ObjectModel",
                "netstandard"
            };

            foreach (var path in tpa.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
            {
                var fileName = Path.GetFileNameWithoutExtension(path);
                if (neededPrefixes.Any(prefix => fileName.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
                                                 fileName.StartsWith(prefix + ".", StringComparison.OrdinalIgnoreCase)))
                {
                    if (File.Exists(path))
                    {
                        refs.Add(MetadataReference.CreateFromFile(path));
                    }
                }
            }
        }

        if (refs.Count == 0)
        {
            var coreLibPath = typeof(object).Assembly.Location;
            if (!string.IsNullOrEmpty(coreLibPath) && File.Exists(coreLibPath))
            {
                refs.Add(MetadataReference.CreateFromFile(coreLibPath));
            }
        }

        return refs;
    }

    public async Task<RoslynInspectResponse> InspectCodeAsync(RoslynInspectRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.Code ?? string.Empty;
        if (Encoding.UTF8.GetByteCount(code) > MaxCodeLengthBytes)
        {
            return new RoslynInspectResponse(
                false,
                $"Code exceeds the maximum allowed size of {MaxCodeLengthBytes / 1024} KB.",
                0,
                [],
                null,
                string.Empty,
                string.Empty
            );
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return new RoslynInspectResponse(false, "C# source code is empty.", 0, [], null, string.Empty, string.Empty);
        }

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(5));
        var ct = cts.Token;

        var sw = System.Diagnostics.Stopwatch.StartNew();
        var acquired = await CompileSemaphore.WaitAsync(TimeSpan.FromSeconds(5), ct);
        if (!acquired)
        {
            return new RoslynInspectResponse(
                false,
                "Compiler server is currently busy. Please retry in a moment.",
                sw.Elapsed.TotalMilliseconds,
                [],
                null,
                string.Empty,
                string.Empty
            );
        }

        try
        {
            var parseOptions = CSharpParseOptions.Default.WithLanguageVersion(Microsoft.CodeAnalysis.CSharp.LanguageVersion.Preview);
            var syntaxTree = CSharpSyntaxTree.ParseText(code, parseOptions, cancellationToken: ct);
            var root = await syntaxTree.GetRootAsync(ct);

            var maxDepth = Math.Clamp(request.MaxSyntaxTreeDepth, 2, 8);
            var astDto = BuildSyntaxNodeDto(root, 0, maxDepth);

            var optLevel = string.Equals(request.OptimizationLevel, "Debug", StringComparison.OrdinalIgnoreCase)
                ? OptimizationLevel.Debug
                : OptimizationLevel.Release;

            var compilationOptions = new CSharpCompilationOptions(
                OutputKind.DynamicallyLinkedLibrary,
                optimizationLevel: optLevel,
                allowUnsafe: false,
                nullableContextOptions: NullableContextOptions.Enable
            );

            var compilation = CSharpCompilation.Create(
                assemblyName: "DevAssistantInMemorySnippet",
                syntaxTrees: [syntaxTree],
                references: CoreReferences.Value,
                options: compilationOptions
            );

            using var peStream = new MemoryStream();
            var emitResult = compilation.Emit(peStream, cancellationToken: ct);

            var diagnostics = emitResult.Diagnostics
                .Where(d => d.Severity != DiagnosticSeverity.Hidden)
                .Select(MapDiagnostic)
                .ToList();

            if (!emitResult.Success)
            {
                sw.Stop();
                return new RoslynInspectResponse(
                    false,
                    "Compilation failed with errors. Fix compiler errors to view lowered C# and IL.",
                    Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                    diagnostics,
                    astDto,
                    string.Empty,
                    string.Empty
                );
            }

            // Decompile from in-memory PE stream ONLY (never load or execute user assembly)
            peStream.Position = 0;
            using var peFile = new PEFile("DevAssistantInMemorySnippet.dll", peStream, PEStreamOptions.PrefetchEntireImage);

            // 1. Lowered C# (disable high-level sugar to reveal compiler lowering)
            var decompilerSettings = new DecompilerSettings(ICSharpCode.Decompiler.CSharp.LanguageVersion.CSharp1)
            {
                AsyncAwait = false,
                YieldReturn = false,
                PatternMatching = false,
                SwitchExpressions = false,
                TupleTypes = false,
                NullableReferenceTypes = false,
                ExtensionMethods = false,
                ExpressionTrees = false,
                UsingDeclarations = false,
                ForEachStatement = false,
                LockStatement = false,
                ShowXmlDocumentation = false
            };

            string loweredCSharp;
            try
            {
                var resolver = new UniversalAssemblyResolver(null, false, peFile.Metadata.DetectTargetFrameworkId());
                var decompiler = new CSharpDecompiler(peFile, resolver, decompilerSettings);
                loweredCSharp = decompiler.DecompileWholeModuleAsString();
            }
            catch (Exception ex)
            {
                loweredCSharp = $"// Lowered C# decompilation note: {ex.Message}";
            }

            // 2. IL Disassembly
            var ilOutput = new PlainTextOutput();
            var disassembler = new ReflectionDisassembler(ilOutput, ct)
            {
                DetectControlStructure = true,
                ShowSequencePoints = false,
                ShowMetadataTokens = false
            };
            disassembler.WriteModuleContents(peFile);
            var ilCode = ilOutput.ToString();

            sw.Stop();
            return new RoslynInspectResponse(
                true,
                null,
                Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                diagnostics,
                astDto,
                loweredCSharp.Trim(),
                ilCode.Trim()
            );
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return new RoslynInspectResponse(
                false,
                "Compilation timed out.",
                Math.Round(sw.Elapsed.TotalMilliseconds, 2),
                [],
                null,
                string.Empty,
                string.Empty
            );
        }
        finally
        {
            CompileSemaphore.Release();
        }
    }

    private static RoslynDiagnosticDto MapDiagnostic(Diagnostic d)
    {
        var lineSpan = d.Location.GetLineSpan();
        return new RoslynDiagnosticDto(
            d.Id,
            d.Severity.ToString(),
            d.GetMessage(),
            lineSpan.StartLinePosition.Line + 1,
            lineSpan.StartLinePosition.Character + 1
        );
    }

    private static RoslynSyntaxNodeDto BuildSyntaxNodeDto(SyntaxNode node, int depth, int maxDepth)
    {
        string? identifier = node switch
        {
            BaseTypeDeclarationSyntax tds => tds.Identifier.ValueText,
            MethodDeclarationSyntax mds => mds.Identifier.ValueText,
            PropertyDeclarationSyntax pds => pds.Identifier.ValueText,
            ParameterSyntax ps => ps.Identifier.ValueText,
            VariableDeclaratorSyntax vds => vds.Identifier.ValueText,
            IdentifierNameSyntax ins => ins.Identifier.ValueText,
            _ => null
        };

        var lineSpan = node.GetLocation().GetLineSpan();
        var spanText = $"L{lineSpan.StartLinePosition.Line + 1}:{lineSpan.StartLinePosition.Character + 1}";

        var children = new List<RoslynSyntaxNodeDto>();
        if (depth < maxDepth)
        {
            foreach (var child in node.ChildNodes().Take(40))
            {
                children.Add(BuildSyntaxNodeDto(child, depth + 1, maxDepth));
            }
        }

        return new RoslynSyntaxNodeDto(node.Kind().ToString(), spanText, identifier, children);
    }

    public CSharpToTsRoslynResponse ConvertCSharpToTypeScript(CSharpToTsRoslynRequest request)
    {
        var code = request.Code ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code))
        {
            return new CSharpToTsRoslynResponse(false, string.Empty, 0, []);
        }

        if (Encoding.UTF8.GetByteCount(code) > MaxCodeLengthBytes)
        {
            return new CSharpToTsRoslynResponse(
                false,
                string.Empty,
                0,
                [new RoslynDiagnosticDto("LIMIT001", "Error", "Code exceeds 20 KB limit.", 1, 1)]
            );
        }

        var syntaxTree = CSharpSyntaxTree.ParseText(code, CSharpParseOptions.Default.WithLanguageVersion(Microsoft.CodeAnalysis.CSharp.LanguageVersion.Preview));
        var root = syntaxTree.GetRoot();
        var diagnostics = syntaxTree.GetDiagnostics()
            .Where(d => d.Severity == DiagnosticSeverity.Error)
            .Select(MapDiagnostic)
            .ToList();

        var sb = new StringBuilder();
        var exportPrefix = request.ExportKeywords ? "export " : string.Empty;
        int count = 0;

        // 1. Enums
        foreach (var enumDecl in root.DescendantNodes().OfType<EnumDeclarationSyntax>())
        {
            count++;
            var enumName = enumDecl.Identifier.ValueText;
            sb.AppendLine($"{exportPrefix}enum {enumName} {{");
            foreach (var member in enumDecl.Members)
            {
                var memberName = member.Identifier.ValueText;
                if (member.EqualsValue is not null)
                {
                    sb.AppendLine($"  {memberName} = {member.EqualsValue.Value.ToFullString().Trim()},");
                }
                else
                {
                    sb.AppendLine($"  {memberName},");
                }
            }
            sb.AppendLine("}");
            sb.AppendLine();
        }

        // 2. Classes, Records, Structs, Interfaces
        var typeDecls = root.DescendantNodes()
            .Where(n => n is ClassDeclarationSyntax or RecordDeclarationSyntax or StructDeclarationSyntax or InterfaceDeclarationSyntax)
            .Cast<TypeDeclarationSyntax>();

        foreach (var typeDecl in typeDecls)
        {
            count++;
            var typeName = typeDecl.Identifier.ValueText;
            var typeParams = typeDecl.TypeParameterList?.ToFullString().Trim() ?? string.Empty;

            if (request.UseTypeInsteadOfInterface)
            {
                sb.AppendLine($"{exportPrefix}type {typeName}{typeParams} = {{");
            }
            else
            {
                sb.AppendLine($"{exportPrefix}interface {typeName}{typeParams} {{");
            }

            // Positional record parameters
            if (typeDecl is RecordDeclarationSyntax recordDecl && recordDecl.ParameterList is { Parameters.Count: > 0 })
            {
                foreach (var param in recordDecl.ParameterList.Parameters)
                {
                    var propName = FormatPropName(param.Identifier.ValueText, param.AttributeLists, request.CamelCaseProperties);
                    var (tsType, isNullable) = MapTypeSyntaxToTs(param.Type, request.DateMapping);
                    var opt = isNullable ? "?" : string.Empty;
                    var finalType = isNullable ? $"{tsType} | null" : tsType;
                    sb.AppendLine($"  {propName}{opt}: {finalType};");
                }
            }

            // Standard properties
            foreach (var prop in typeDecl.Members.OfType<PropertyDeclarationSyntax>())
            {
                if (prop.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword) || m.IsKind(SyntaxKind.PrivateKeyword)))
                {
                    continue;
                }

                if (HasAttribute(prop.AttributeLists, "JsonIgnore"))
                {
                    continue;
                }

                var propName = FormatPropName(prop.Identifier.ValueText, prop.AttributeLists, request.CamelCaseProperties);
                var (tsType, isNullable) = MapTypeSyntaxToTs(prop.Type, request.DateMapping);
                var opt = isNullable ? "?" : string.Empty;
                var finalType = isNullable ? $"{tsType} | null" : tsType;
                sb.AppendLine($"  {propName}{opt}: {finalType};");
            }

            sb.AppendLine(request.UseTypeInsteadOfInterface ? "};" : "}");
            sb.AppendLine();
        }

        return new CSharpToTsRoslynResponse(
            diagnostics.Count == 0 && count > 0,
            sb.ToString().TrimEnd(),
            count,
            diagnostics
        );
    }

    public CSharpToJsonSchemaRoslynResponse ConvertCSharpToJsonSchema(CSharpToJsonSchemaRoslynRequest request)
    {
        var code = request.Code ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code))
        {
            return new CSharpToJsonSchemaRoslynResponse(false, string.Empty, null, []);
        }

        if (Encoding.UTF8.GetByteCount(code) > MaxCodeLengthBytes)
        {
            return new CSharpToJsonSchemaRoslynResponse(
                false,
                string.Empty,
                null,
                [new RoslynDiagnosticDto("LIMIT001", "Error", "Code exceeds 20 KB limit.", 1, 1)]
            );
        }

        var syntaxTree = CSharpSyntaxTree.ParseText(code, CSharpParseOptions.Default.WithLanguageVersion(Microsoft.CodeAnalysis.CSharp.LanguageVersion.Preview));
        var root = syntaxTree.GetRoot();
        var diagnostics = syntaxTree.GetDiagnostics()
            .Where(d => d.Severity == DiagnosticSeverity.Error)
            .Select(MapDiagnostic)
            .ToList();

        var enums = root.DescendantNodes().OfType<EnumDeclarationSyntax>()
            .ToDictionary(e => e.Identifier.ValueText, e => e, StringComparer.Ordinal);

        var types = root.DescendantNodes()
            .Where(n => n is ClassDeclarationSyntax or RecordDeclarationSyntax or StructDeclarationSyntax)
            .Cast<TypeDeclarationSyntax>()
            .ToList();

        if (types.Count == 0 && enums.Count == 0)
        {
            return new CSharpToJsonSchemaRoslynResponse(false, string.Empty, null, diagnostics);
        }

        var rootType = (!string.IsNullOrWhiteSpace(request.RootTypeName)
            ? types.FirstOrDefault(t => t.Identifier.ValueText.Equals(request.RootTypeName, StringComparison.OrdinalIgnoreCase))
            : null) ?? types.FirstOrDefault();

        var schemaRoot = new JsonObject
        {
            ["$schema"] = "https://json-schema.org/draft/2020-12/schema"
        };

        if (rootType is not null)
        {
            schemaRoot["title"] = rootType.Identifier.ValueText;
            var builtRoot = BuildTypeSchemaObject(rootType, request.CamelCaseProperties, request.AdditionalPropertiesFalse, types, enums);
            foreach (var kv in builtRoot)
            {
                schemaRoot[kv.Key] = kv.Value?.DeepClone();
            }
        }

        if (types.Count > 1 || enums.Count > 0)
        {
            var defs = new JsonObject();
            foreach (var enumDecl in enums.Values)
            {
                var enumValues = new JsonArray();
                foreach (var m in enumDecl.Members)
                {
                    enumValues.Add(m.Identifier.ValueText);
                }
                defs[enumDecl.Identifier.ValueText] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = enumValues
                };
            }

            foreach (var t in types)
            {
                if (rootType is not null && t.Identifier.ValueText == rootType.Identifier.ValueText)
                    continue;

                defs[t.Identifier.ValueText] = BuildTypeSchemaObject(t, request.CamelCaseProperties, request.AdditionalPropertiesFalse, types, enums);
            }

            if (defs.Count > 0)
            {
                schemaRoot["$defs"] = defs;
            }
        }

        var jsonText = schemaRoot.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
        return new CSharpToJsonSchemaRoslynResponse(
            diagnostics.Count == 0,
            jsonText,
            rootType?.Identifier.ValueText,
            diagnostics
        );
    }

    private static JsonObject BuildTypeSchemaObject(
        TypeDeclarationSyntax typeDecl,
        bool camelCase,
        bool additionalPropertiesFalse,
        List<TypeDeclarationSyntax> allTypes,
        Dictionary<string, EnumDeclarationSyntax> allEnums)
    {
        var propertiesObj = new JsonObject();
        var requiredList = new List<string>();

        var members = new List<(string RawName, TypeSyntax? Type, SyntaxList<AttributeListSyntax> Attrs)>();

        if (typeDecl is RecordDeclarationSyntax rec && rec.ParameterList is { Parameters.Count: > 0 })
        {
            foreach (var p in rec.ParameterList.Parameters)
            {
                members.Add((p.Identifier.ValueText, p.Type, p.AttributeLists));
            }
        }

        foreach (var prop in typeDecl.Members.OfType<PropertyDeclarationSyntax>())
        {
            if (prop.Modifiers.Any(m => m.IsKind(SyntaxKind.StaticKeyword) || m.IsKind(SyntaxKind.PrivateKeyword)))
                continue;
            if (HasAttribute(prop.AttributeLists, "JsonIgnore"))
                continue;

            members.Add((prop.Identifier.ValueText, prop.Type, prop.AttributeLists));
        }

        foreach (var (rawName, typeSyntax, attrs) in members)
        {
            var jsonName = FormatPropName(rawName, attrs, camelCase);
            var (propSchema, isNullable) = MapTypeSyntaxToJsonSchema(typeSyntax, allTypes, allEnums);
            ApplyDataAnnotations(propSchema, attrs, out bool hasRequiredAttr);

            if (!isNullable || hasRequiredAttr)
            {
                requiredList.Add(jsonName);
            }

            propertiesObj[jsonName] = propSchema;
        }

        var obj = new JsonObject
        {
            ["type"] = "object",
            ["properties"] = propertiesObj
        };

        if (requiredList.Count > 0)
        {
            var reqArr = new JsonArray();
            foreach (var r in requiredList.Distinct())
            {
                reqArr.Add(r);
            }
            obj["required"] = reqArr;
        }

        if (additionalPropertiesFalse)
        {
            obj["additionalProperties"] = false;
        }

        return obj;
    }

    private static (JsonObject Schema, bool IsNullable) MapTypeSyntaxToJsonSchema(
        TypeSyntax? typeSyntax,
        List<TypeDeclarationSyntax> allTypes,
        Dictionary<string, EnumDeclarationSyntax> allEnums)
    {
        if (typeSyntax is null)
        {
            return (new JsonObject { ["type"] = "object" }, true);
        }

        bool isNullable = false;
        if (typeSyntax is NullableTypeSyntax nullableType)
        {
            isNullable = true;
            typeSyntax = nullableType.ElementType;
        }

        if (typeSyntax is ArrayTypeSyntax arrayType)
        {
            var (itemSchema, _) = MapTypeSyntaxToJsonSchema(arrayType.ElementType, allTypes, allEnums);
            return (new JsonObject { ["type"] = "array", ["items"] = itemSchema }, isNullable);
        }

        if (typeSyntax is GenericNameSyntax genericName)
        {
            var gId = genericName.Identifier.ValueText;
            var args = genericName.TypeArgumentList.Arguments;

            if (gId is "Nullable" && args.Count == 1)
            {
                var (inner, _) = MapTypeSyntaxToJsonSchema(args[0], allTypes, allEnums);
                return (inner, true);
            }

            if (gId is "List" or "IList" or "IEnumerable" or "ICollection" or "IReadOnlyList" or "IReadOnlyCollection" or "HashSet" && args.Count == 1)
            {
                var (itemSchema, _) = MapTypeSyntaxToJsonSchema(args[0], allTypes, allEnums);
                return (new JsonObject { ["type"] = "array", ["items"] = itemSchema }, isNullable);
            }

            if (gId is "Dictionary" or "IDictionary" or "IReadOnlyDictionary" && args.Count == 2)
            {
                var (valSchema, _) = MapTypeSyntaxToJsonSchema(args[1], allTypes, allEnums);
                return (new JsonObject { ["type"] = "object", ["additionalProperties"] = valSchema }, isNullable);
            }
        }

        var rawType = typeSyntax.ToString().Trim();
        var schema = rawType switch
        {
            "string" or "String" or "char" or "Char" => new JsonObject { ["type"] = "string" },
            "Guid" or "System.Guid" => new JsonObject { ["type"] = "string", ["format"] = "uuid" },
            "DateTime" or "DateTimeOffset" or "System.DateTime" or "System.DateTimeOffset" => new JsonObject { ["type"] = "string", ["format"] = "date-time" },
            "DateOnly" or "System.DateOnly" => new JsonObject { ["type"] = "string", ["format"] = "date" },
            "TimeOnly" or "TimeSpan" => new JsonObject { ["type"] = "string", ["format"] = "time" },
            "bool" or "Boolean" => new JsonObject { ["type"] = "boolean" },
            "byte" or "sbyte" or "short" or "ushort" or "int" or "uint" or "long" or "ulong" or "Int16" or "Int32" or "Int64" => new JsonObject { ["type"] = "integer" },
            "float" or "double" or "decimal" or "Single" or "Double" or "Decimal" => new JsonObject { ["type"] = "number" },
            _ => BuildCustomTypeRef(rawType, allTypes, allEnums)
        };

        if (isNullable && schema["type"] is JsonValue typeVal && typeVal.TryGetValue<string>(out var tStr))
        {
            schema["type"] = new JsonArray(tStr, "null");
        }

        return (schema, isNullable);
    }

    private static JsonObject BuildCustomTypeRef(
        string typeName,
        List<TypeDeclarationSyntax> allTypes,
        Dictionary<string, EnumDeclarationSyntax> allEnums)
    {
        if (allEnums.ContainsKey(typeName) || allTypes.Any(t => t.Identifier.ValueText == typeName))
        {
            return new JsonObject { ["$ref"] = $"#/$defs/{typeName}" };
        }
        return new JsonObject { ["type"] = "object" };
    }

    private static void ApplyDataAnnotations(JsonObject propSchema, SyntaxList<AttributeListSyntax> attrLists, out bool isRequired)
    {
        isRequired = false;
        foreach (var attr in attrLists.SelectMany(al => al.Attributes))
        {
            var name = attr.Name.ToString();
            if (name.EndsWith("Attribute", StringComparison.Ordinal))
                name = name[..^9];

            var args = attr.ArgumentList?.Arguments.Select(a => a.Expression.ToString().Trim('"', '\'')).ToList() ?? [];

            switch (name)
            {
                case "Required":
                    isRequired = true;
                    break;
                case "MaxLength":
                case "StringLength":
                    if (args.Count > 0 && int.TryParse(args[0], out int maxLen))
                    {
                        propSchema["maxLength"] = maxLen;
                    }
                    foreach (var namedArg in attr.ArgumentList?.Arguments ?? default)
                    {
                        if (namedArg.NameEquals?.Name.Identifier.ValueText == "MinimumLength" &&
                            int.TryParse(namedArg.Expression.ToString(), out int minL))
                        {
                            propSchema["minLength"] = minL;
                        }
                    }
                    break;
                case "MinLength":
                    if (args.Count > 0 && int.TryParse(args[0], out int minLen))
                    {
                        propSchema["minLength"] = minLen;
                    }
                    break;
                case "Range":
                    if (args.Count >= 2)
                    {
                        if (double.TryParse(args[0], out double minVal)) propSchema["minimum"] = minVal;
                        if (double.TryParse(args[1], out double maxVal)) propSchema["maximum"] = maxVal;
                    }
                    break;
                case "RegularExpression":
                    if (args.Count > 0)
                    {
                        var pat = args[0].TrimStart('@').Trim('"');
                        propSchema["pattern"] = pat;
                    }
                    break;
                case "EmailAddress":
                    propSchema["format"] = "email";
                    break;
                case "Url":
                    propSchema["format"] = "uri";
                    break;
            }
        }
    }

    private static (string TsType, bool IsNullable) MapTypeSyntaxToTs(TypeSyntax? typeSyntax, string dateMapping)
    {
        if (typeSyntax is null) return ("unknown", true);

        bool isNullable = false;
        if (typeSyntax is NullableTypeSyntax nullable)
        {
            isNullable = true;
            typeSyntax = nullable.ElementType;
        }

        if (typeSyntax is ArrayTypeSyntax arr)
        {
            var (elem, _) = MapTypeSyntaxToTs(arr.ElementType, dateMapping);
            return ($"{elem}[]", isNullable);
        }

        if (typeSyntax is GenericNameSyntax gen)
        {
            var gName = gen.Identifier.ValueText;
            var args = gen.TypeArgumentList.Arguments;

            if (gName is "Task" or "ValueTask")
            {
                return args.Count == 1 ? MapTypeSyntaxToTs(args[0], dateMapping) : ("void", false);
            }

            if (gName == "Nullable" && args.Count == 1)
            {
                var (inner, _) = MapTypeSyntaxToTs(args[0], dateMapping);
                return (inner, true);
            }

            if (gName is "List" or "IList" or "IEnumerable" or "ICollection" or "IReadOnlyList" or "IReadOnlyCollection" or "HashSet" && args.Count == 1)
            {
                var (elem, _) = MapTypeSyntaxToTs(args[0], dateMapping);
                return ($"{elem}[]", isNullable);
            }

            if (gName is "Dictionary" or "IDictionary" or "IReadOnlyDictionary" && args.Count == 2)
            {
                var (k, _) = MapTypeSyntaxToTs(args[0], dateMapping);
                var (v, _) = MapTypeSyntaxToTs(args[1], dateMapping);
                return ($"Record<{k}, {v}>", isNullable);
            }

            var mappedArgs = string.Join(", ", args.Select(a => MapTypeSyntaxToTs(a, dateMapping).TsType));
            return ($"{gName}<{mappedArgs}>", isNullable);
        }

        var raw = typeSyntax.ToString().Trim();
        var mapped = raw switch
        {
            "string" or "String" or "char" or "Char" or "Guid" or "System.Guid" or "TimeSpan" or "TimeOnly" => "string",
            "DateTime" or "DateTimeOffset" or "DateOnly" or "System.DateTime" or "System.DateTimeOffset" =>
                string.Equals(dateMapping, "Date", StringComparison.OrdinalIgnoreCase) ? "Date" : "string",
            "bool" or "Boolean" => "boolean",
            "byte" or "sbyte" or "short" or "ushort" or "int" or "uint" or "long" or "ulong" or "float" or "double" or "decimal"
                or "Int16" or "Int32" or "Int64" or "Single" or "Double" or "Decimal" => "number",
            "object" or "Object" or "dynamic" => "unknown",
            _ => raw
        };

        return (mapped, isNullable);
    }

    private static string FormatPropName(string csharpName, SyntaxList<AttributeListSyntax> attrLists, bool camelCase)
    {
        foreach (var attr in attrLists.SelectMany(al => al.Attributes))
        {
            var attrName = attr.Name.ToString();
            if (attrName is "JsonPropertyName" or "JsonProperty" && attr.ArgumentList?.Arguments.Count > 0)
            {
                var arg = attr.ArgumentList.Arguments[0].Expression.ToString().Trim('"', '\'');
                if (!string.IsNullOrWhiteSpace(arg))
                {
                    return arg;
                }
            }
        }

        if (!camelCase || string.IsNullOrEmpty(csharpName))
            return csharpName;

        return char.ToLowerInvariant(csharpName[0]) + csharpName[1..];
    }

    private static bool HasAttribute(SyntaxList<AttributeListSyntax> attrLists, string targetName)
    {
        return attrLists
            .SelectMany(al => al.Attributes)
            .Any(a =>
            {
                var n = a.Name.ToString();
                return n.Equals(targetName, StringComparison.OrdinalIgnoreCase) ||
                       n.Equals(targetName + "Attribute", StringComparison.OrdinalIgnoreCase);
            });
    }
}
