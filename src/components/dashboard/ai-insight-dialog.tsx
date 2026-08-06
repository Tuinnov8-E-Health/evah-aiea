"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { analyzeClinicalHistory } from "@/lib/client-api";
import { Bot, Loader2 } from "lucide-react";

interface AiInsightDialogProps {
  historyData: any;
  children?: React.ReactNode;
}

export function AiInsightDialog({ historyData, children }: AiInsightDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState("");

  const handleFetchInsights = async () => {
    setIsLoading(true);
    setInsights("");
    try {
      const historyString = JSON.stringify(
        historyData.map((d: any) => ({
          date: d.date,
          summary: d.summary,
          urgency: d.recommendation?.urgencyLevel,
        })),
        null,
        2
      );
      
      const response = await analyzeClinicalHistory({ historyJson: historyString });
      setInsights(response.insights);

    } catch (error) {
      console.error("Failed to get AI insights", error);
      setInsights(
        "Could not generate clinical insights at this time. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleFetchInsights();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Bot className="mr-2 h-4 w-4" />
            Clinical Insights
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI Clinical Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered review of the patient's epilepsy history based on mhGAP protocols. This is suggestive analysis for clinical review only.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[150px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-muted-foreground">Analyzing clinical timeline...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground">
              <p className="whitespace-pre-wrap">{insights}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
