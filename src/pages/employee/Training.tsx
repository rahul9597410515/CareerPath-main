import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  provider: string;
  url: string;
}

interface Enrollment {
  id: string;
  program_id: string;
  status: string;
  progress: number;
}

const EmployeeTraining = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchPrograms(), fetchEnrollments()]);
  };

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("training_programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("training_enrollments")
        .select("id, program_id, status, progress")
        .eq("user_id", user.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const handleEnroll = async (programId: string, programUrl?: string) => {
    setEnrollingId(programId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to enroll",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("training_enrollments")
        .insert([{
          user_id: user.id,
          program_id: programId,
          status: "enrolled",
          progress: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully enrolled in the program"
      });

      await fetchEnrollments();

      if (programUrl) {
        window.open(programUrl, "_blank");
      }
    } catch (error: any) {
      console.error("Error enrolling:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in program",
        variant: "destructive"
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (programId: string) => {
    return enrollments.some(e => e.program_id === programId);
  };

  const getEnrollment = (programId: string) => {
    return enrollments.find(e => e.program_id === programId);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training Programs</h1>
        <p className="text-muted-foreground">Browse and enroll in available courses</p>
      </div>

      {programs.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No training programs available</h3>
            <p className="text-muted-foreground">Check back later for new courses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => {
            const enrolled = isEnrolled(program.id);
            const enrollment = getEnrollment(program.id);
            
            return (
              <Card key={program.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-warning" />
                      <span className="line-clamp-2">{program.title}</span>
                    </CardTitle>
                    {enrolled && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{program.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {program.category && <Badge variant="secondary">{program.category}</Badge>}
                    {program.duration && <Badge variant="outline">{program.duration}</Badge>}
                    {program.provider && (
                      <Badge variant="outline" className="text-xs">{program.provider}</Badge>
                    )}
                  </div>
                  {enrolled ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment?.progress || 0}%</span>
                      </div>
                      {program.url && (
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => window.open(program.url, "_blank")}
                        >
                          Continue Learning
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      variant="default" 
                      className="w-full gap-2"
                      onClick={() => handleEnroll(program.id, program.url)}
                      disabled={enrollingId === program.id}
                    >
                      {enrollingId === program.id ? "Enrolling..." : "Enroll Now"}
                      {program.url && <ExternalLink className="h-4 w-4" />}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeTraining;
