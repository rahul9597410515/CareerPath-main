import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: string;
  category: string;
}

const EmployeeSkills = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    skill_name: "",
    proficiency_level: "",
    category: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skill_name.trim() || !formData.proficiency_level) {
      toast({
        title: "Error",
        description: "Please fill in skill name and proficiency level",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add skills",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("skills")
        .insert([{
          user_id: user.id,
          skill_name: formData.skill_name.trim(),
          proficiency_level: formData.proficiency_level,
          category: formData.category.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Skill added successfully"
      });

      setFormData({
        skill_name: "",
        proficiency_level: "",
        category: ""
      });
      setOpen(false);
      fetchSkills();
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  const getProficiencyColor = (level: string) => {
    const colors = {
      beginner: "bg-yellow-500",
      intermediate: "bg-blue-500",
      advanced: "bg-purple-500",
      expert: "bg-green-500",
    };
    return colors[level as keyof typeof colors] || "bg-gray-500";
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
          <h1 className="text-3xl font-bold text-foreground">My Skills</h1>
          <p className="text-muted-foreground">Track and manage your professional skills</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skill_name">Skill Name *</Label>
                <Input
                  id="skill_name"
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  placeholder="e.g., Python, Project Management"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency_level">Proficiency Level *</Label>
                <Select
                  value={formData.proficiency_level}
                  onValueChange={(value) => setFormData({ ...formData, proficiency_level: value })}
                  required
                >
                  <SelectTrigger id="proficiency_level">
                    <SelectValue placeholder="Select proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Technical, Soft Skills"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Skill</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {skills.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills added yet</h3>
            <p className="text-muted-foreground mb-4">Start building your skill profile</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Skill
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{skill.skill_name}</span>
                  <Award className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skill.category && (
                  <Badge variant="secondary">{skill.category}</Badge>
                )}
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getProficiencyColor(skill.proficiency_level)}`} />
                  <span className="text-sm capitalize">{skill.proficiency_level}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeSkills;
