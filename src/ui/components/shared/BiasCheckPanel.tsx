import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { generateCompletion } from '@/lib/openai';
import { biasCheckPrompt } from '@/lib/prompts/bias';
import { refinePrompt } from '@/lib/prompts/refine';
import type { BiasCheckResult, BiasIssue } from '@/lib/prompts/bias';
import type { ResearchObjectType, ResearchObjectContent } from '@/types';
import {
    Search,
    Loader2,
    AlertTriangle,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Undo2,
    X,
    Check,
} from 'lucide-react';

interface BiasCheckPanelProps {
    artifactType: ResearchObjectType;
    currentContent: ResearchObjectContent;
    onFixed: (newContent: ResearchObjectContent, confidence: string, suggestions: string[]) => void;
}

export function BiasCheckPanel({
    artifactType,
    currentContent,
    onFixed,
}: BiasCheckPanelProps) {
    const {
        settings, isSignedIn,
        biasCheckResults,
        setBiasCheckResult,
        clearBiasCheckResult,
        previousVersions,
        setPreviousVersion,
        clearPreviousVersion,
    } = useStore();

    const result = biasCheckResults[artifactType];
    const prevVersion = previousVersions[artifactType];

    const [isChecking, setIsChecking] = useState(false);
    const [isFixingAll, setIsFixingAll] = useState(false);
    const [fixingIndex, setFixingIndex] = useState<number | null>(null);
    const [showDiffs, setShowDiffs] = useState(false);
    const [fixedIndices, setFixedIndices] = useState<Set<number>>(new Set());

    // --- Run bias check ---
    const runBiasCheck = useCallback(async () => {
        if (!isSignedIn) return;

        setIsChecking(true);
        setFixedIndices(new Set());

        try {
            const biasResult = await generateCompletion<BiasCheckResult>(
                settings,
                biasCheckPrompt.system,
                biasCheckPrompt.buildUserPrompt(
                    artifactType,
                    JSON.stringify(currentContent, null, 2)
                )
            );

            setBiasCheckResult(artifactType, biasResult);
        } catch (err) {
            console.error('Bias check error:', err);
        } finally {
            setIsChecking(false);
        }
    }, [settings, artifactType, currentContent, setBiasCheckResult]);

    // --- Fix a single issue ---
    const fixSingle = useCallback(
        async (issue: BiasIssue, index: number) => {
            if (!isSignedIn) return;

            setFixingIndex(index);

            try {
                const instruction = `Fix this bias issue in question ${issue.questionId}:\n\nBias type: ${issue.biasType}\nOriginal: "${issue.original}"\nSuggested fix: "${issue.suggestion}"\nReason: ${issue.explanation}\n\nRewrite the question to be unbiased while preserving the research intent. Only modify the affected question, keep everything else unchanged.`;

                const fixResult = await generateCompletion<
                    ResearchObjectContent & { confidence?: string; improvementSuggestions?: string[] }
                >(
                    settings,
                    refinePrompt.system,
                    refinePrompt.buildUserPrompt(
                        artifactType,
                        JSON.stringify(currentContent, null, 2),
                        instruction
                    )
                );

                const { confidence, improvementSuggestions, ...content } = fixResult;
                onFixed(
                    content as ResearchObjectContent,
                    confidence || 'medium',
                    improvementSuggestions || []
                );

                setFixedIndices((prev) => new Set([...prev, index]));
            } catch (err) {
                console.error('Fix single bias error:', err);
            } finally {
                setFixingIndex(null);
            }
        },
        [settings, artifactType, currentContent, onFixed]
    );

    // --- Fix all issues ---
    const fixAll = useCallback(async () => {
        if (!isSignedIn || !result) return;

        setIsFixingAll(true);

        // Save current version for restore
        const snapshotContent = { ...currentContent };

        try {
            const unfixed = result.issues.filter((_, i) => !fixedIndices.has(i));
            if (unfixed.length === 0) return;

            const instruction = `Fix all of the following bias issues. For each issue, rewrite the affected question to eliminate the bias while preserving research intent.\n\n${unfixed
                .map(
                    (issue, i) =>
                        `${i + 1}. [${issue.biasType}] Question ${issue.questionId}: "${issue.original}" → "${issue.suggestion}" (${issue.explanation})`
                )
                .join('\n')}\n\nReturn the complete updated content with all fixes applied. Also include a "biasFixDiffs" array in your response with one entry per fix: { "questionId": "...", "biasType": "...", "before": "original text", "after": "fixed text", "rationale": "brief explanation" }`;

            const fixResult = await generateCompletion<
                ResearchObjectContent & {
                    confidence?: string;
                    improvementSuggestions?: string[];
                    biasFixDiffs?: Array<{
                        questionId: string;
                        biasType: string;
                        before: string;
                        after: string;
                        rationale: string;
                    }>;
                }
            >(
                settings,
                refinePrompt.system,
                refinePrompt.buildUserPrompt(
                    artifactType,
                    JSON.stringify(currentContent, null, 2),
                    instruction
                )
            );

            const { confidence, improvementSuggestions, biasFixDiffs, ...content } = fixResult;

            // Save previous version with diffs for restore
            setPreviousVersion(artifactType, snapshotContent, biasFixDiffs || []);

            onFixed(
                content as ResearchObjectContent,
                confidence || 'medium',
                improvementSuggestions || []
            );

            // Mark all as fixed
            setFixedIndices(new Set(result.issues.map((_, i) => i)));

            // Clear bias check results since content has changed
            clearBiasCheckResult(artifactType);
        } catch (err) {
            console.error('Fix all bias error:', err);
        } finally {
            setIsFixingAll(false);
        }
    }, [
        settings,
        artifactType,
        currentContent,
        result,
        fixedIndices,
        onFixed,
        setPreviousVersion,
        clearBiasCheckResult,
    ]);

    // --- Restore previous version ---
    const handleRestore = useCallback(() => {
        if (!prevVersion) return;
        onFixed(prevVersion.content, 'medium', []);
        clearPreviousVersion(artifactType);
    }, [prevVersion, onFixed, clearPreviousVersion, artifactType]);

    // --- No results yet: show CTA ---
    if (!result) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={runBiasCheck}
                    disabled={isChecking}
                    className="text-xs"
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Checking…
                        </>
                    ) : (
                        <>
                            <Search className="h-3 w-3 mr-1" />
                            Check for Bias
                        </>
                    )}
                </Button>

                {/* Show restore if previous version exists */}
                {prevVersion && prevVersion.diffs.length > 0 && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDiffs(!showDiffs)}
                            className="text-xs text-muted-foreground"
                        >
                            <ChevronDown className="h-3 w-3 mr-1" />
                            {prevVersion.diffs.length} bias {prevVersion.diffs.length === 1 ? 'fix' : 'fixes'} applied
                        </Button>
                    </>
                )}
            </div>
        );
    }

    // --- Results panel ---
    const errorCount = result.issues.filter((i) => i.severity === 'error').length;
    const warningCount = result.issues.filter((i) => i.severity === 'warning').length;
    const unfixedCount = result.issues.filter((_, i) => !fixedIndices.has(i)).length;

    return (
        <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                        <Search className="h-4 w-4" />
                        Bias Check
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {unfixedCount > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-white/80 border-blue-300 text-blue-800 hover:bg-blue-100"
                                onClick={fixAll}
                                disabled={isFixingAll || fixingIndex !== null}
                            >
                                {isFixingAll ? (
                                    <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Fixing…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Fix All
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                            onClick={() => clearBiasCheckResult(artifactType)}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                {/* Summary line */}
                <div className="flex items-center gap-3 text-xs">
                    {errorCount > 0 && (
                        <span className="flex items-center gap-1 text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            {errorCount} {errorCount === 1 ? 'issue' : 'issues'}
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            {warningCount} {warningCount === 1 ? 'caution' : 'cautions'}
                        </span>
                    )}
                    {result.issues.length === 0 && (
                        <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            No bias issues found
                        </span>
                    )}
                </div>

                {/* Issues */}
                {result.issues.map((issue, i) => {
                    const isFixed = fixedIndices.has(i);
                    const isError = issue.severity === 'error';

                    return (
                        <div
                            key={i}
                            className={`rounded-md border p-3 text-sm space-y-1.5 ${isFixed
                                ? 'bg-green-50 border-green-200 opacity-60'
                                : isError
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-amber-50 border-amber-200'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {isFixed ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    ) : isError ? (
                                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                    ) : (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                    )}
                                    <span
                                        className={`font-medium text-xs ${isFixed
                                            ? 'text-green-700'
                                            : isError
                                                ? 'text-red-700'
                                                : 'text-amber-700'
                                            }`}
                                    >
                                        {issue.biasType} ({issue.questionId})
                                    </span>
                                </div>
                                {!isFixed && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`h-6 px-2 text-[11px] ${isError
                                            ? 'text-red-700 hover:text-red-900 hover:bg-red-100'
                                            : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
                                            }`}
                                        onClick={() => fixSingle(issue, i)}
                                        disabled={fixingIndex === i || isFixingAll}
                                    >
                                        {fixingIndex === i ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            'Apply'
                                        )}
                                    </Button>
                                )}
                            </div>
                            <p className={`text-xs ${isFixed ? 'text-green-600 line-through' : 'text-muted-foreground'}`}>
                                &ldquo;{issue.original}&rdquo;
                            </p>
                            <p className={`text-xs ${isFixed ? 'text-green-700' : isError ? 'text-red-700' : 'text-amber-700'}`}>
                                → {issue.suggestion}
                            </p>
                            <p className="text-[11px] text-muted-foreground italic">
                                {issue.explanation}
                            </p>
                        </div>
                    );
                })}

                {/* Passes */}
                {result.passes.length > 0 && (
                    <div className="space-y-1 pt-1">
                        {result.passes.map((pass, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-xs text-green-700"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>No {pass.biasType.toLowerCase()} detected</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Re-check button */}
                <div className="pt-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={runBiasCheck}
                        disabled={isChecking}
                        className="text-xs text-blue-600 hover:text-blue-800 h-7"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Re-checking…
                            </>
                        ) : (
                            <>
                                <Search className="h-3 w-3 mr-1" />
                                Re-check
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>

            {/* Version diff panel (collapsed by default) */}
            {prevVersion && prevVersion.diffs.length > 0 && (
                <div className="border-t border-blue-200">
                    <button
                        onClick={() => setShowDiffs(!showDiffs)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-xs text-blue-700 hover:bg-blue-100/50 transition-colors"
                    >
                        {showDiffs ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                        <CheckCircle2 className="h-3 w-3" />
                        {prevVersion.diffs.length} bias {prevVersion.diffs.length === 1 ? 'fix' : 'fixes'} applied
                        <span className="ml-auto text-[10px] text-blue-500">What changed</span>
                    </button>
                    {showDiffs && (
                        <div className="px-4 pb-3 space-y-2">
                            {prevVersion.diffs.map((diff, i) => (
                                <div
                                    key={i}
                                    className="rounded border border-blue-200 bg-white/60 p-2 text-xs space-y-1"
                                >
                                    <div className="font-medium text-blue-800">
                                        {diff.questionId}: {diff.biasType}
                                    </div>
                                    <div className="text-red-600 line-through">
                                        &ldquo;{diff.before}&rdquo;
                                    </div>
                                    <div className="text-green-700">
                                        &ldquo;{diff.after}&rdquo;
                                    </div>
                                    <div className="text-muted-foreground italic">
                                        {diff.rationale}
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRestore}
                                className="text-xs text-blue-600 hover:text-blue-800 h-7"
                            >
                                <Undo2 className="h-3 w-3 mr-1" />
                                Restore Previous Version
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
