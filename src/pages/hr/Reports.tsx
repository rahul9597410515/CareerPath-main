import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Users, BookOpen, Target, TrendingUp } from "lucide-react";

interface EmployeeReport {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  skills_count: number;
  goals_count: number;
  training_count: number;
}

interface SkillReport {
  skill_name: string;
  proficiency_level: string;
  category: string;
  employee_name: string;
}

interface TrainingReport {
  employee_name: string;
  program_title: string;
  status: string;
  progress: number;
  enrollment_date: string;
}

interface GoalReport {
  employee_name: string;
  goal_title: string;
  target_role: string;
  timeline: string;
  status: string;
}

const HRReports = () => {
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [skillReports, setSkillReports] = useState<SkillReport[]>([]);
  const [trainingReports, setTrainingReports] = useState<TrainingReport[]>([]);
  const [goalReports, setGoalReports] = useState<GoalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSkills: 0,
    activeTraining: 0,
    activeGoals: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Fetch employee overview
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*");

      if (profiles) {
        const employeeData = await Promise.all(
          profiles.map(async (profile) => {
            const { count: skillsCount } = await supabase
              .from("skills")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            const { count: goalsCount } = await supabase
              .from("career_goals")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            const { count: trainingCount } = await supabase
              .from("training_enrollments")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            return {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              position: profile.position || "Not specified",
              department: profile.department || "Not specified",
              skills_count: skillsCount || 0,
              goals_count: goalsCount || 0,
              training_count: trainingCount || 0
            };
          })
        );

        setEmployeeReports(employeeData);
        setStats(prev => ({ ...prev, totalEmployees: employeeData.length }));
      }

      // Fetch skills report
      const { data: skills } = await supabase
        .from("skills")
        .select("*");

      if (skills) {
        const skillData = await Promise.all(
          skills.map(async (skill) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", skill.user_id)
              .single();

            return {
              skill_name: skill.skill_name,
              proficiency_level: skill.proficiency_level,
              category: skill.category || "Uncategorized",
              employee_name: profile?.full_name || "Unknown"
            };
          })
        );
        setSkillReports(skillData);
        setStats(prev => ({ ...prev, totalSkills: skillData.length }));
      }

      // Fetch training report
      const { data: training } = await supabase
        .from("training_enrollments")
        .select("*");

      if (training) {
        const trainingData = await Promise.all(
          training.map(async (t) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", t.user_id)
              .single();

            const { data: program } = await supabase
              .from("training_programs")
              .select("title")
              .eq("id", t.program_id)
              .single();

            return {
              employee_name: profile?.full_name || "Unknown",
              program_title: program?.title || "Unknown",
              status: t.status,
              progress: t.progress,
              enrollment_date: new Date(t.enrollment_date).toLocaleDateString()
            };
          })
        );
        setTrainingReports(trainingData);
        setStats(prev => ({ 
          ...prev, 
          activeTraining: trainingData.filter((t: any) => t.status === "enrolled").length 
        }));
      }

      // Fetch goals report
      const { data: goals } = await supabase
        .from("career_goals")
        .select("*");

      if (goals) {
        const goalData = await Promise.all(
          goals.map(async (g) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", g.user_id)
              .single();

            return {
              employee_name: profile?.full_name || "Unknown",
              goal_title: g.goal_title,
              target_role: g.target_role || "Not specified",
              timeline: g.timeline || "Not specified",
              status: g.status
            };
          })
        );
        setGoalReports(goalData);
        setStats(prev => ({ 
          ...prev, 
          activeGoals: goalData.filter((g: any) => g.status === "active").length 
        }));
      }

    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: `${filename} exported successfully`
    });
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
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate and view organizational reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSkills}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Training</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTraining}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGoals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detailed Reports
          </CardTitle>
          <CardDescription>
            View and export detailed organizational reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="employees" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="employees">Employees</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => exportToCSV(employeeReports, "employee_report")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Skills</TableHead>
                      <TableHead className="text-center">Goals</TableHead>
                      <TableHead className="text-center">Training</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeReports.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{emp.skills_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{emp.goals_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{emp.training_count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => exportToCSV(skillReports, "skills_report")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Skill</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Proficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skillReports.map((skill, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{skill.employee_name}</TableCell>
                        <TableCell>{skill.skill_name}</TableCell>
                        <TableCell>{skill.category}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {skill.proficiency_level}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => exportToCSV(trainingReports, "training_report")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingReports.map((training, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{training.employee_name}</TableCell>
                        <TableCell>{training.program_title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {training.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{training.progress}%</TableCell>
                        <TableCell>{training.enrollment_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => exportToCSV(goalReports, "goals_report")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Target Role</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goalReports.map((goal, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{goal.employee_name}</TableCell>
                        <TableCell>{goal.goal_title}</TableCell>
                        <TableCell>{goal.target_role}</TableCell>
                        <TableCell>{goal.timeline}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {goal.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRReports;
