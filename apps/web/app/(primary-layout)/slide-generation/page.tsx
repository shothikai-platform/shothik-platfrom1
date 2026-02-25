"use client";

/**
 * SlideGenerationPage
 * 
 * New slide generation interface with:
 * - Space-based organization (Stitch AI pattern)
 * - Memory-aware generation
 * - Checkpoint-based progress
 * - Parallel execution support
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Presentation, 
  Sparkles, 
  Settings, 
  Clock,
  Zap,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

import { PresentationSpaceSelector } from "@/components/presentation/spaces/PresentationSpaceSelector";
import { MemoryPanel } from "@/components/presentation/memory/MemoryPanel";
import { CheckpointProgress } from "@/components/presentation/checkpoints/CheckpointProgress";
import { usePresentationSpace } from "@/hooks/presentation/spaces/usePresentationSpace";
import { useCheckpointGeneration } from "@/hooks/presentation/spaces/useCheckpointGeneration";
import { CheckpointStep } from "@/components/presentation/checkpoints/CheckpointProgress";

const themes = [
  { id: 'professional', name: 'Professional', color: '#0066CC' },
  { id: 'creative', name: 'Creative', color: '#FF6B35' },
  { id: 'minimal', name: 'Minimal', color: '#333333' },
  { id: 'educational', name: 'Educational', color: '#10B981' },
  { id: 'modern', name: 'Modern', color: '#8B5CF6' },
];

export default function SlideGenerationPage() {
  const [step, setStep] = useState<'space' | 'input' | 'generating' | 'result'>('space');
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [selectedTheme, setSelectedTheme] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('general');
  
  // Hooks
  const {
    spaces,
    currentSpace,
    memories,
    selectSpace,
    saveMemory,
    getStylePreferences,
  } = usePresentationSpace();
  
  const {
    job,
    isLoading,
    createJob,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    rollbackToCheckpoint,
  } = useCheckpointGeneration();

  // Handle space selection
  const handleSelectSpace = (spaceId: string) => {
    selectSpace(spaceId);
    setStep('input');
  };

  // Start generation
  const handleStartGeneration = async () => {
    if (!currentSpace || !prompt.trim()) return;
    
    // Save user preferences to memory
    await saveMemory('style_preference', `Selected theme: ${selectedTheme}`, {
      preferredColors: [themes.find(t => t.id === selectedTheme)?.color],
      preferredThemes: [selectedTheme],
    });
    
    await saveMemory('content_pattern', `Topic: ${title || prompt}`, {
      commonTopics: [title || prompt],
      audienceType: targetAudience,
    });
    
    // Create job
    const newJob = createJob({
      spaceId: currentSpace.id,
      prompt,
      title: title || prompt.slice(0, 50),
      slideCount,
      theme: selectedTheme,
    });
    
    setStep('generating');
    
    // Start generation
    await startGeneration(newJob.id);
  };

  // Get style preferences for suggestions
  const stylePreferences = getStylePreferences();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Presentation className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Slide Generation</h1>
                <p className="text-sm text-muted-foreground">
                  {currentSpace ? `Space: ${currentSpace.name}` : 'Select a space to begin'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {step !== 'space' && (
                <Button variant="outline" onClick={() => setStep('space')}>
                  Change Space
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'space' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Presentation Space</CardTitle>
                </CardHeader>
                <CardContent>
                  <PresentationSpaceSelector
                    onSelectSpace={handleSelectSpace}
                    selectedSpaceId={currentSpace?.id}
                  />
                </CardContent>
              </Card>
            )}

            {step === 'input' && currentSpace && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Presentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prompt Input */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">What would you like to present? *</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., AI trends in 2025, focusing on enterprise adoption and ethical considerations..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Presentation Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="Leave blank to auto-generate"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Slide Count */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Number of Slides</Label>
                      <span className="text-sm font-medium">{slideCount} slides</span>
                    </div>
                    <Slider
                      value={[slideCount]}
                      onValueChange={(value) => setSlideCount(value[0])}
                      min={5}
                      max={30}
                      step={1}
                    />
                  </div>

                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <Label>Select Theme</Label>
                    <div className="grid grid-cols-5 gap-3">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-center",
                            selectedTheme === theme.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div
                            className="w-8 h-8 rounded-full mx-auto mb-2"
                            style={{ backgroundColor: theme.color }}
                          />
                          <span className="text-xs font-medium">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <div className="flex flex-wrap gap-2">
                      {['general', 'executives', 'students', 'technical', 'children'].map((audience) => (
                        <Button
                          key={audience}
                          variant={targetAudience === audience ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTargetAudience(audience)}
                        >
                          {audience.charAt(0).toUpperCase() + audience.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep('space')}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    
                    <Button
                      onClick={handleStartGeneration}
                      disabled={!prompt.trim() || isLoading}
                      size="lg"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Presentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'generating' && job && (
              <CheckpointProgress
                checkpoints={job.checkpoints}
                currentStep={job.currentStep}
                overallProgress={job.overallProgress}
                isPaused={job.status === 'paused'}
                onPause={pauseGeneration}
                onResume={resumeGeneration}
                onSaveCheckpoint={(step) => console.log('Save checkpoint:', step)}
                onRollback={rollbackToCheckpoint}
                onViewCheckpoint={(step) => console.log('View checkpoint:', step)}
              />
            )}
          </div>

          {/* Right Panel - Memory & Context */}
          <div className="space-y-6">
            {currentSpace && (
              <>
                <MemoryPanel spaceId={currentSpace.id} />
                
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Space Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Presentations</span>
                      <span className="font-medium">{currentSpace.presentationCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Memories</span>
                      <span className="font-medium">{memories.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Active</span>
                      <span className="font-medium">
                        {currentSpace.lastModified.toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Suggestions */}
                {stylePreferences.colors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Based on your past presentations:
                      </p>
                      
                      {stylePreferences.colors.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Suggested Colors</p>
                          <div className="flex gap-2">
                            {stylePreferences.colors.slice(0, 5).map((color, i) => (
                              <button
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  // Apply color suggestion
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Pro Tip</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be specific about your target audience for better results. 
                      The AI learns from each generation to improve future presentations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
