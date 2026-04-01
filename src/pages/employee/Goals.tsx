import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  goal_title: string;
  goal_description: string;
  target_role: string;
  timeline: string;
  status: string;
}

const EmployeeGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    goal_title: "",
    goal_description: "",
    target_role: "",
    timeline: "",
    status: "active"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("career_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.goal_title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add goals",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("career_goals")
        .insert([{
          user_id: user.id,
          goal_title: formData.goal_title.trim(),
          goal_description: formData.goal_description.trim() || null,
          target_role: formData.target_role.trim() || null,
          timeline: formData.timeline.trim() || null,
          status: formData.status
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Career goal added successfully"
      });

      setFormData({
        goal_title: "",
        goal_description: "",
        target_role: "",
        timeline: "",
        status: "active"
      });
      setOpen(false);
      fetchGoals();
    } catch (error) {
      console.error("Error adding goal:", error);
      toast({
        title: "Error",
        description: "Failed to add career goal",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "secondary",
      in_progress: "default",
      completed: "default",
    };
    return colors[status] || "secondary";
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
          <h1 className="text-3xl font-bold text-foreground">Career Goals</h1>
          <p className="text-muted-foreground">Define and track your career aspirations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Career Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal_title">Goal Title *</Label>
                <Input
                  id="goal_title"
                  value={formData.goal_title}
                  onChange={(e) => setFormData({ ...formData, goal_title: e.target.value })}
                  placeholder="e.g., Become a Senior Developer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_description">Description</Label>
                <Textarea
                  id="goal_description"
                  value={formData.goal_description}
                  onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
                  placeholder="Describe your career goal in detail"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_role">Target Role</Label>
                  <Input
                    id="target_role"
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="e.g., 12 months, 2 years"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Goal</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals set yet</h3>
            <p className="text-muted-foreground mb-4">Start planning your career path</p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Set Your First Goal
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-accent" />
                      {goal.goal_title}
                    </CardTitle>
                    {goal.target_role && (
                      <p className="text-sm text-muted-foreground">Target: {goal.target_role}</p>
                    )}
                  </div>
                  <Badge variant={getStatusColor(goal.status)} className="capitalize">
                    {goal.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {goal.goal_description && (
                  <p className="text-sm text-muted-foreground">{goal.goal_description}</p>
                )}
                {goal.timeline && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Timeline:</span>
                    <span className="text-muted-foreground">{goal.timeline}</span>
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

export default EmployeeGoals;
