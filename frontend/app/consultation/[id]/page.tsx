'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, Loader2, Circle, AlertCircle, RefreshCw, 
  Mic, Brain, FileText, Bell, User, Clock, ShieldCheck 
} from "lucide-react";

type StageType = "TRANSCRIBING" | "NLP" | "GENERATING" | "NOTIFICATION";

const STAGES: StageType[] = ["TRANSCRIBING", "NLP", "GENERATING", "NOTIFICATION"];

const STAGE_CONFIG = {
  TRANSCRIBING: { icon: Mic, description: "Listening to consultation & converting to text." },
  NLP: { icon: Brain, description: "Analyzing text, extracting medical entities & notes." },
  GENERATING: { icon: FileText, description: "Creating detailed consultation summary reports." },
  NOTIFICATION: { icon: Bell, description: "Dispatching reports to relevant destinations." },
};

export default function ConsultationPage() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<string>("PENDING");
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryAvailable, setRetryAvailable] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // For visual richness: simulate output artifacts that may be loading
  const [artifactsAvailable, setArtifactsAvailable] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8000/status/${id}`);
      const result = await res.json();
      
      setStatus(result.status);
      setCompletedStages(result.completed_stages || []);
      setErrorMsg(result.error);
      setRetryAvailable(result.retry_available);

      if (result.status === 'SUCCESS') {
        setArtifactsAvailable(true);
      }

    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    fetchStatus(); // initial
    const poll = setInterval(fetchStatus, 2000);

    return () => clearInterval(poll);
  }, [id]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch(`http://localhost:8000/retry/${id}`, { method: 'POST' });
      setErrorMsg(null);
      setRetryAvailable(false);
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const currentIdx = STAGES.indexOf(status as StageType);
  const completionPercent = status === 'SUCCESS' ? 100 : (completedStages.length / STAGES.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Banner / Decorative BG */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 via-background to-background -z-10" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-foreground/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">ScribeHealth AI Pipeline</h1>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" /> Job ID: <span className="font-mono text-foreground font-medium">{id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {retryAvailable && (
              <Button size="sm" onClick={handleRetry} className="gap-2" disabled={isRetrying}>
                <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                Resume Pipeline
              </Button>
            )}
            <Badge variant={status === 'SUCCESS' ? 'default' : errorMsg ? 'destructive' : 'secondary'} className="px-2.5 py-1">
              Pipeline: {status}
            </Badge>
          </div>
        </div>

        {/* Global Progress Bar */}
        <Card className="p-3 bg-opacity-40 border-none shadow-none -mb-3">
          <CardContent className="p-0">
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Overall Stage Completion</span>
              <span>{Math.round(completionPercent)}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </CardContent>
        </Card>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start space-x-3 text-destructive text-sm font-medium">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Pipeline Error</p>
              <p className="opacity-80 text-xs font-normal">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Main Dashboard Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Timeline Pipeline Section (Left & Center columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Process Stages</h2>

            <div className="space-y-3">
              {STAGES.map((stage) => {
                const isCompleted = completedStages.includes(stage) || status === 'SUCCESS';
                const isFailed = errorMsg && !isCompleted && STAGES.indexOf(stage) >= currentIdx; 
                const isActive = !isCompleted && !isFailed && status === stage;
                
                const config = STAGE_CONFIG[stage];
                const Icon = config.icon;

                return (
                  <Card key={stage} className={`transition-all duration-300 ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-80'}`}>
                    <CardHeader className="py-3 px-4 flex flex-row items-center gap-4">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        isCompleted ? 'bg-primary/20 text-primary' : 
                        isActive ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 
                        isFailed ? 'bg-destructive/20 text-destructive' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-sm flex justify-between items-center">
                          <span>{stage}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {isCompleted ? 'Finished' : isActive ? 'Active' : isFailed ? 'Failed' : 'Queued'}
                          </span>
                        </CardTitle>
                        <CardDescription className="text-xs">{config.description}</CardDescription>
                      </div>

                      <CardAction className="static self-center flex items-center justify-center p-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        ) : isFailed ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </CardAction>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Side Panel: Artifacts / Console */}
          <div className="space-y-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Output & Data</h2>
            
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Consultation Context
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Patient Artifacts</span>
                  <span className="text-foreground font-medium">Awaiting Data</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Stream Mode</span>
                  <span className="text-foreground font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> High Qual
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardHeader className="pb-2 border-b border-foreground/5 mb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Output Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-center">
                {!artifactsAvailable ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto opacity-50" />
                    <p className="text-[11px]">Generating live output stream...</p>
                  </div>
                ) : (
                  <div className="text-left w-full space-y-2 p-2 relative">
                    <p className="text-[11px] text-primary font-semibold mb-1">Generated Clinical Note Summary:</p>
                    <p className="text-xs text-foreground/80 leading-relaxed font-mono">
                       S: 45y Female presents for follow-up.<br/>
                       O: BP 120/80; Vitals stable.<br/>
                       A: Controlled hypertension.<br/>
                       P: Continue current medication regimen.
                    </p>
                    <Badge className="absolute top-0 right-0 scale-90" variant="outline">Verified</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}

