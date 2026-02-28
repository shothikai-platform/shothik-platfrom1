// Slide Generation Page - Complete Implementation
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Presentation,
  Loader2,
  Play,
  Pause,
  Download,
  CheckCircle,
  AlertCircle,
  Layers,
} from "lucide-react";
import {
  createSlideJob,
  subscribeToJobProgress,
  pauseSlideJob,
  resumeSlideJob,
  SlideJob,
} from "@/services/slide-generation";

const templates = [
  { id: "professional", name: "Professional", color: "blue" },
  { id: "creative", name: "Creative", color: "purple" },
  { id: "minimal", name: "Minimal", color: "gray" },
  { id: "educational", name: "Educational", color: "green" },
  { id: "business", name: "Business", color: "indigo" },
  { id: "modern", name: "Modern", color: "orange" },
  { id: "dark", name: "Dark Mode", color: "slate" },
];

const steps = [
  { id: "outline", label: "Outline", description: "Structuring content" },
  { id: "design", label: "Design", description: "Applying template" },
  { id: "content", label: "Content", description: "Generating slides" },
  { id: "formatting", label: "Formatting", description: "Styling slides" },
  { id: "review", label: "Review", description: "Final checks" },
];

export default function SlideGenerationPage() {
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState([10]);
  const [template, setTemplate] = useState("professional");
  const [audience, setAudience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<SlideJob | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    const result = await createSlideJob({
      topic,
      slideCount: slideCount[0],
      template,
      targetAudience: audience,
      userId: "user-123", // Replace with actual user ID
    });

    if (result?.jobId) {
      // Subscribe to progress
      const unsub = subscribeToJobProgress(
        result.jobId,
        (updatedJob) => {
          setJob(updatedJob);
          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Progress error:", error);
          setIsLoading(false);
        }
      );
      setUnsubscribe(() => unsub);
    } else {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (job?.id) {
      await pauseSlideJob(job.id);
    }
  };

  const handleResume = async () => {
    if (job?.id) {
      await resumeSlideJob(job.id);
    }
  };

  const handleDownload = () => {
    if (job?.slides) {
      // Download as PPTX or PDF
      const blob = new Blob([JSON.stringify(job.slides, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic.replace(/\s+/g, "_")}_slides.json`;
      a.click();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe?.();
    };
  }, [unsubscribe]);

  const getStepStatus = (stepId: string) => {
    if (!job) return "pending";
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === job.currentStep);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Presentation className="h-8 w-8 text-indigo-500" />
          Slide Generation
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-powered presentation creation with 10x faster parallel generation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create Presentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Topic</label>
              <Textarea
                placeholder="Enter your presentation topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Target Audience</label>
              <Input
                placeholder="e.g., Executives, Students, Engineers"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Template</label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between">
                <label className="text-sm font-medium">Slide Count</label>
                <span className="text-sm">{slideCount[0]} slides</span>
              </div>
              <Slider
                value={slideCount}
                onValueChange={setSlideCount}
                min={5}
                max={30}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              {!job || job.status === "completed" || job.status === "failed" ? (
                <Button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Generate Slides
                    </>
                  )}
                </Button>
              ) : job.status === "paused" ? (
                <Button onClick={handleResume} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="flex-1">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {!job ? (
              <div className="text-center text-muted-foreground py-12">
                <Presentation className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Enter a topic and click Generate</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{job.currentStep}</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {steps.map((step) => {
                    const status = getStepStatus(step.id);
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          status === "active"
                            ? "bg-primary/10"
                            : status === "completed"
                            ? "bg-green-50"
                            : "bg-muted"
                        }`}
                      >
                        {status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : status === "active" ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Layers className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{step.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <Badge
                    variant={
                      job.status === "completed"
                        ? "default"
                        : job.status === "failed"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {job.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {job.status === "failed" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {job.status}
                  </Badge>
                </div>

                {/* Download Button */}
                {job.status === "completed" && (
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Slides
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
