import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingDown, Users, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface SkillData {
  skill_name: string;
  count: number;
  avg_proficiency: number;
  employees: Array<{ user_id: string; full_name: string; proficiency_level: string }>;
}

interface ProficiencyDistribution {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const HRAnalytics = () => {
  const [skillsData, setSkillsData] = useState<SkillData[]>([]);
  const [proficiencyDist, setProficiencyDist] = useState<ProficiencyDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all skills
      const { data: skills, error: skillsError } = await supabase
        .from("skills")
        .select("skill_name, proficiency_level, user_id");

      if (skillsError) throw skillsError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      if (profilesError) throw profilesError;

      // Create a map of user_id to full_name
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      setTotalEmployees(profiles?.length || 0);

      // Process skills data
      const skillMap = new Map<string, SkillData>();
      const proficiencyCount = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };

      skills?.forEach((skill) => {
        const skillName = skill.skill_name;
        const fullName = profileMap.get(skill.user_id) || "Unknown";
        
        if (!skillMap.has(skillName)) {
          skillMap.set(skillName, {
            skill_name: skillName,
            count: 0,
            avg_proficiency: 0,
            employees: []
          });
        }

        const skillData = skillMap.get(skillName)!;
        skillData.count += 1;
        skillData.employees.push({
          user_id: skill.user_id,
          full_name: fullName,
          proficiency_level: skill.proficiency_level
        });

        // Count proficiency levels
        const level = skill.proficiency_level.toLowerCase();
        if (level in proficiencyCount) {
          proficiencyCount[level as keyof typeof proficiencyCount] += 1;
        }
      });

      // Calculate average proficiency
      const proficiencyValues = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      skillMap.forEach((data) => {
        const sum = data.employees.reduce((acc, emp) => {
          return acc + (proficiencyValues[emp.proficiency_level.toLowerCase() as keyof typeof proficiencyValues] || 0);
        }, 0);
        data.avg_proficiency = sum / data.count;
      });

      // Sort by count descending
      const sortedSkills = Array.from(skillMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setSkillsData(sortedSkills);

      // Set proficiency distribution
      setProficiencyDist([
        { name: "Beginner", value: proficiencyCount.beginner },
        { name: "Intermediate", value: proficiencyCount.intermediate },
        { name: "Advanced", value: proficiencyCount.advanced },
        { name: "Expert", value: proficiencyCount.expert }
      ]);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (avg: number) => {
    if (avg >= 3.5) return "text-green-600";
    if (avg >= 2.5) return "text-blue-600";
    if (avg >= 1.5) return "text-yellow-600";
    return "text-red-600";
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
        <h1 className="text-3xl font-bold text-foreground">Skill Gap Analysis</h1>
        <p className="text-muted-foreground">Identify skill gaps across your organization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Skills</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillsData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Needing Development</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skillsData.filter(s => s.avg_proficiency < 2.5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Skills by Employee Count */}
        <Card>
          <CardHeader>
            <CardTitle>Top Skills Distribution</CardTitle>
            <CardDescription>Most common skills across employees</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Proficiency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Proficiency Distribution</CardTitle>
            <CardDescription>Overall skill proficiency levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={proficiencyDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {proficiencyDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Skill Gap Details
          </CardTitle>
          <CardDescription>
            Skills requiring development and training focus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillsData.map((skill) => (
              <div key={skill.skill_name} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{skill.skill_name}</h3>
                    <Badge variant="outline">{skill.count} employees</Badge>
                    <span className={`text-sm font-medium ${getProficiencyColor(skill.avg_proficiency)}`}>
                      Avg: {skill.avg_proficiency.toFixed(2)}/4.0
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skill.employees.slice(0, 5).map((emp) => (
                    <Badge key={emp.user_id} variant="secondary">
                      {emp.full_name} ({emp.proficiency_level})
                    </Badge>
                  ))}
                  {skill.employees.length > 5 && (
                    <Badge variant="outline">+{skill.employees.length - 5} more</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAnalytics;
