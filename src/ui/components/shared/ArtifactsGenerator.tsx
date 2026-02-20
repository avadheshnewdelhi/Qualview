import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, User, Heart, Map, CheckCircle2, ExternalLink } from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { personaPrompt, empathyMapPrompt, journeyMapPrompt } from '@/lib/prompts';
import type { InsightsContent, PersonaContent, EmpathyMapContent, JourneyMapContent, ConfidenceLevel } from '@/types';
import { postMessage } from '@/lib/figma';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ArtifactsGeneratorProps {
    insights: InsightsContent;
}

type ArtifactType = 'persona' | 'empathy-map' | 'journey-map';

export function ArtifactsGenerator({ insights }: ArtifactsGeneratorProps) {
    const {
        context, transcripts, settings, isSignedIn,
        setLoading, setError, setSettingsOpen,
        getResearchObject, addResearchObject
    } = useStore();

    const isOnline = useOnlineStatus();

    const [activeTab, setActiveTab] = useState<ArtifactType>('persona');

    const persona = getResearchObject('persona')?.content as PersonaContent | undefined;
    const empathyMap = getResearchObject('empathy-map')?.content as EmpathyMapContent | undefined;
    const journeyMap = getResearchObject('journey-map')?.content as JourneyMapContent | undefined;

    const handleGenerate = async (type: ArtifactType) => {
        if (!isSignedIn) {
            setSettingsOpen(true);
            return;
        }
        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        const typeLabels: Record<ArtifactType, string> = {
            'persona': 'Behavioral Persona',
            'empathy-map': 'Empathy Map',
            'journey-map': 'User Journey Map'
        };

        setLoading(true, `Generating ${typeLabels[type]}...`);
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            let result: any;

            if (type === 'persona') {
                result = await generateCompletion<PersonaContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                    settings,
                    personaPrompt.system,
                    personaPrompt.buildUserPrompt(contextSummary, insights, transcripts)
                );
            } else if (type === 'empathy-map') {
                result = await generateCompletion<EmpathyMapContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                    settings,
                    empathyMapPrompt.system,
                    empathyMapPrompt.buildUserPrompt(contextSummary, insights, transcripts)
                );
            } else if (type === 'journey-map') {
                result = await generateCompletion<JourneyMapContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                    settings,
                    journeyMapPrompt.system,
                    journeyMapPrompt.buildUserPrompt(contextSummary, insights, transcripts)
                );
            }

            const { confidence, improvementSuggestions, ...content } = result;
            addResearchObject(type, content, confidence, improvementSuggestions);
        } catch (err) {
            console.error(`Failed to generate ${type}:`, err);
            setError(err instanceof Error ? err.message : `Failed to generate ${typeLabels[type]}`);
        } finally {
            setLoading(false);
        }
    };

    const handleInsert = (type: ArtifactType) => {
        const obj = getResearchObject(type);
        if (obj) {
            postMessage({ type: 'INSERT_VISUALIZATION', payload: { vizType: type, data: obj.content } });
        }
    };

    const renderEmptyState = (type: ArtifactType, icon: React.ReactNode, title: string, description: string) => (
        <Card className="border-dashed shadow-none bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
                    {description}
                </p>
                <Button onClick={() => handleGenerate(type)} disabled={!isSignedIn || !isOnline}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {title}
                </Button>
            </CardContent>
        </Card>
    );

    const renderPersona = () => {
        if (!persona) return renderEmptyState('persona', <User className="w-6 h-6" />, 'Behavioral Persona', 'Synthesize transcripts into a data-driven persona focused on goals and behaviors.');
        return (
            <Card>
                <CardHeader className="pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">{persona.name}</CardTitle>
                            <CardDescription className="text-xs">{persona.role}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleInsert('persona')}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Canvas
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs font-normal">
                    <p className="text-muted-foreground leading-relaxed italic border-l-2 border-primary/40 pl-3">
                        {persona.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Behaviors</h4>
                            <ul className="space-y-1.5">
                                {persona.behaviors.map((b, i) => <li key={i} className="flex gap-1.5 items-start"><span className="text-primary mt-px">›</span> <span>{b}</span></li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Goals</h4>
                            <ul className="space-y-1.5">
                                {persona.goals.map((g, i) => <li key={i} className="flex gap-1.5 items-start"><span className="text-green-500 mt-px">›</span> <span>{g}</span></li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Frustrations</h4>
                            <ul className="space-y-1.5">
                                {persona.frustrations.map((f, i) => <li key={i} className="flex gap-1.5 items-start"><span className="text-red-400 mt-px">›</span> <span>{f}</span></li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Needs</h4>
                            <ul className="space-y-1.5">
                                {persona.needs.map((n, i) => <li key={i} className="flex gap-1.5 items-start"><span className="text-blue-500 mt-px">›</span> <span>{n}</span></li>)}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                        <Button variant="ghost" className="w-full text-xs" onClick={() => handleGenerate('persona')}>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate Persona
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderEmpathyMap = () => {
        if (!empathyMap) return renderEmptyState('empathy-map', <Heart className="w-6 h-6" />, 'Empathy Map', 'Map what users say, think, do, and feel based on the synthesized insights.');
        return (
            <Card>
                <CardHeader className="pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Empathy Map</CardTitle>
                            <CardDescription className="text-xs">Based on: {empathyMap.targetUser}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleInsert('empathy-map')}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Canvas
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-px bg-border text-xs">
                    <div className="bg-card p-3">
                        <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2 text-blue-500">Says</h4>
                        <ul className="space-y-1.5">
                            {empathyMap.quadrants.says.map((s, i) => <li key={i} className="italic text-muted-foreground">"{s}"</li>)}
                        </ul>
                    </div>
                    <div className="bg-card p-3">
                        <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2 text-purple-500">Thinks</h4>
                        <ul className="space-y-1.5">
                            {empathyMap.quadrants.thinks.map((t, i) => <li key={i}>• {t}</li>)}
                        </ul>
                    </div>
                    <div className="bg-card p-3">
                        <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2 text-green-500">Does</h4>
                        <ul className="space-y-1.5">
                            {empathyMap.quadrants.does.map((d, i) => <li key={i}>• {d}</li>)}
                        </ul>
                    </div>
                    <div className="bg-card p-3">
                        <h4 className="font-semibold text-[10px] uppercase text-muted-foreground tracking-wider mb-2 text-rose-500">Feels</h4>
                        <ul className="space-y-1.5 text-rose-700 dark:text-rose-300">
                            {empathyMap.quadrants.feels.map((f, i) => (
                                <li key={i} className="leading-tight">• {f}</li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
                <div className="p-3 border-t border-border">
                    <Button variant="ghost" className="w-full text-xs h-7" onClick={() => handleGenerate('empathy-map')}>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate Empathy Map
                    </Button>
                </div>
            </Card>
        );
    };

    const renderJourneyMap = () => {
        if (!journeyMap) return renderEmptyState('journey-map', <Map className="w-6 h-6" />, 'Journey Map', 'Plot the chronological experience, aligning pain points and emotions state-by-state.');
        return (
            <Card>
                <CardHeader className="pb-3 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">{journeyMap.title}</CardTitle>
                            <CardDescription className="text-xs">Based on: {journeyMap.targetUser}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleInsert('journey-map')}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Canvas
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {journeyMap.stages.map((stage, idx) => (
                        <div key={idx} className="relative pl-4 pb-4 border-l-2 border-muted last:pb-0 last:border-0">
                            <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-1.5 ring-4 ring-card" />
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-semibold">{stage.name}</h4>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${stage.emotion === 'positive' ? 'bg-green-100 text-green-700' : stage.emotion === 'negative' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {stage.emotion}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-2">{stage.description}</p>

                            <div className="space-y-1.5 text-[10px]">
                                {stage.painPoints.length > 0 && (
                                    <div className="flex gap-2 text-red-600/90 dark:text-red-400">
                                        <span className="font-semibold shrink-0 w-8">Pain</span>
                                        <div className="flex-1 space-y-0.5">
                                            {stage.painPoints.map((p, i) => <p key={i}>• {p}</p>)}
                                        </div>
                                    </div>
                                )}
                                {stage.opportunities.length > 0 && (
                                    <div className="flex gap-2 text-blue-600/90 dark:text-blue-400">
                                        <span className="font-semibold shrink-0 w-8">Opp</span>
                                        <div className="flex-1 space-y-0.5">
                                            {stage.opportunities.map((p, i) => <p key={i}>• {p}</p>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-border mt-2">
                        <Button variant="ghost" className="w-full text-xs h-7" onClick={() => handleGenerate('journey-map')}>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Regenerate Journey
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    variant={activeTab === 'persona' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs px-2 h-8"
                    onClick={() => setActiveTab('persona')}
                >
                    <User className="w-3.5 h-3.5 mr-1.5" /> Persona {persona && <CheckCircle2 className="w-3 h-3 ml-1.5 opacity-50" />}
                </Button>
                <Button
                    variant={activeTab === 'empathy-map' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs px-2 h-8"
                    onClick={() => setActiveTab('empathy-map')}
                >
                    <Heart className="w-3.5 h-3.5 mr-1.5" /> Empathy {empathyMap && <CheckCircle2 className="w-3 h-3 ml-1.5 opacity-50" />}
                </Button>
                <Button
                    variant={activeTab === 'journey-map' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs px-2 h-8"
                    onClick={() => setActiveTab('journey-map')}
                >
                    <Map className="w-3.5 h-3.5 mr-1.5" /> Journey {journeyMap && <CheckCircle2 className="w-3 h-3 ml-1.5 opacity-50" />}
                </Button>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'persona' && renderPersona()}
                {activeTab === 'empathy-map' && renderEmpathyMap()}
                {activeTab === 'journey-map' && renderJourneyMap()}
            </div>
        </div>
    );
}

