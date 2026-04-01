import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Award, TrendingUp, BookOpen } from "lucide-react";

interface DashboardStats {
  skillsCount: number;
  goalsCount: number;
  recommendationsCount: number;
  completedTrainings: number;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    skillsCount: 0,
    goalsCount: 0,
    recommendationsCount: 0,
    completedTrainings: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);

      // Fetch skills count
      const { count: skillsCount } = await supabase
        .from("skills")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch goals count
      const { count: goalsCount } = await supabase
        .from("career_goals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch recommendations count
      const { count: recommendationsCount } = await supabase
        .from("recommendations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch completed trainings
      const { count: completedTrainings } = await supabase
        .from("training_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      setStats({
        skillsCount: skillsCount || 0,
        goalsCount: goalsCount || 0,
        recommendationsCount: recommendationsCount || 0,
        completedTrainings: completedTrainings || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Track your career development progress and discover new opportunities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Skills</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.skillsCount}</div>
            <p className="text-xs text-muted-foreground">Skills documented</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Career Goals</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.goalsCount}</div>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.recommendationsCount}</div>
            <p className="text-xs text-muted-foreground">AI suggestions</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Training</CardTitle>
            <BookOpen className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.completedTrainings}</div>
            <p className="text-xs text-muted-foreground">Programs finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Career Progress</CardTitle>
            <CardDescription>Your skill development journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profile Completion</span>
                <span className="font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Skills Development</span>
                <span className="font-medium">60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Goal Achievement</span>
                <span className="font-medium">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to boost your career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={() => navigate('/employee/skills')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-medium">Add New Skill</span>
                </div>
                <Badge variant="secondary">Quick</Badge>
              </div>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={() => navigate('/employee/goals')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-accent" />
                  <span className="font-medium">Set Career Goal</span>
                </div>
                <Badge variant="secondary">5 min</Badge>
              </div>
            </div>
            <div 
              className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
              onClick={() => navigate('/employee/training')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-warning" />
                  <span className="font-medium">Browse Training</span>
                </div>
                <Badge variant="secondary">Explore</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
