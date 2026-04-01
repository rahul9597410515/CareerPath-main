import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Award, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const HRDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSkills: 0,
    totalGoals: 0,
    totalTrainings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total employees
      const { count: totalEmployees } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total skills
      const { count: totalSkills } = await supabase
        .from("skills")
        .select("*", { count: "exact", head: true });

      // Fetch total goals
      const { count: totalGoals } = await supabase
        .from("career_goals")
        .select("*", { count: "exact", head: true });

      // Fetch total trainings
      const { count: totalTrainings } = await supabase
        .from("training_programs")
        .select("*", { count: "exact", head: true });

      setStats({
        totalEmployees: totalEmployees || 0,
        totalSkills: totalSkills || 0,
        totalGoals: totalGoals || 0,
        totalTrainings: totalTrainings || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const skillsData = [
    { name: "Technical", value: 45 },
    { name: "Leadership", value: 25 },
    { name: "Communication", value: 20 },
    { name: "Other", value: 10 },
  ];

  const departmentData = [
    { department: "Engineering", employees: 45 },
    { department: "Marketing", employees: 28 },
    { department: "Sales", employees: 35 },
    { department: "HR", employees: 12 },
    { department: "Operations", employees: 20 },
  ];

  const COLORS = ["hsl(215, 85%, 50%)", "hsl(195, 85%, 45%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)"];

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
        <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-muted-foreground">
          Organization-wide analytics and employee development insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.totalSkills}</div>
            <p className="text-xs text-muted-foreground">Skills tracked</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Career Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">Organization-wide</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Programs</CardTitle>
            <BookOpen className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.totalTrainings}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Distribution across organization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="employees" fill="hsl(215, 85%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Skills Distribution</CardTitle>
            <CardDescription>Top skill categories</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New employee onboarded</p>
                <p className="text-xs text-muted-foreground">Engineering Department • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="p-2 bg-success/10 rounded-full">
                <Award className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Skill certification completed</p>
                <p className="text-xs text-muted-foreground">Marketing Team • 5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="p-2 bg-warning/10 rounded-full">
                <BookOpen className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New training program added</p>
                <p className="text-xs text-muted-foreground">Leadership Development • 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboard;
