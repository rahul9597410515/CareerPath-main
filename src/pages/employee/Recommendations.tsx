import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Sparkles, Loader2, ExternalLink, Clock, Building2 } from "lucide-react";

interface Recommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  course_name?: string;
  provider?: string;
  source_url?: string;
  duration?: string;
}

const EmployeeRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("generate-recommendations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        if (error.message?.includes("Rate limit")) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before generating more recommendations.",
            variant: "destructive",
          });
        } else if (error.message?.includes("credits")) {
          toast({
            title: "Credits Required",
            description: "Please add AI credits to continue generating recommendations.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Recommendations Generated!",
        description: `${data.count} new personalized recommendations created.`,
      });

      await fetchRecommendations();
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getPriorityColor = (priority: string): "default" | "secondary" | "outline" | "destructive" => {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
    };
    return colors[priority] || "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
          <p className="text-muted-foreground">Personalized career development suggestions</p>
        </div>
        <Button onClick={handleGenerateRecommendations} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Generate with AI" to get personalized career recommendations based on your skills and goals
            </p>
            <Button onClick={handleGenerateRecommendations} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    {rec.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(rec.priority)} className="capitalize">
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {rec.recommendation_type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {rec.description && (
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                )}
                
                {rec.course_name && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Recommended Course</p>
                        <p className="text-sm text-foreground">{rec.course_name}</p>
                      </div>
                    </div>
                    
                    {rec.provider && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Provider</p>
                          <p className="text-sm text-muted-foreground">{rec.provider}</p>
                        </div>
                      </div>
                    )}
                    
                    {rec.duration && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Duration</p>
                          <p className="text-sm text-muted-foreground">{rec.duration}</p>
                        </div>
                      </div>
                    )}
                    
                    {rec.source_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a href={rec.source_url} target="_blank" rel="noopener noreferrer">
                          View Course
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeRecommendations;
