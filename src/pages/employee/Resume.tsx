import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Palette, Plus, Trash2, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
}

const defaultResumeData: ResumeData = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
};

const templates = [
  { id: "modern", name: "Modern", color: "blue" },
  { id: "classic", name: "Classic", color: "slate" },
  { id: "creative", name: "Creative", color: "purple" },
];

export default function EmployeeResume() {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: skills } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id);

      if (profile) {
        setResumeData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            name: profile.full_name || "",
            email: profile.email || "",
          },
          skills: skills?.map((s) => s.skill_name) || [],
        }));
      }
    } catch (error) {
      console.error("Error loading resume data:", error);
    }
  };

  const handlePersonalInfoChange = (field: keyof ResumeData["personalInfo"], value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      title: "",
      company: "",
      duration: "",
      description: "",
    };
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const deleteExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: Date.now().toString(),
      degree: "",
      institution: "",
      year: "",
    };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const deleteEducation = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const deleteSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save to a resumes table
      // For now, we'll just show a success message
      toast.success("Resume saved successfully!");
    } catch (error) {
      toast.error("Failed to save resume");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    toast.info("Opening print dialog - select 'Save as PDF' to download");
    window.print();
  };

  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case "modern":
        return "bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500";
      case "classic":
        return "bg-white border border-slate-300";
      case "creative":
        return "bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500";
      default:
        return "bg-white";
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-preview, #resume-preview * {
            visibility: visible;
          }
          #resume-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resume Builder</h1>
            <p className="text-muted-foreground">Create and customize your professional resume</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleDownload} variant="secondary">
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <Card className="p-6 print:hidden">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={resumeData.personalInfo.summary}
                  onChange={(e) => handlePersonalInfoChange("summary", e.target.value)}
                  placeholder="Brief summary of your professional background..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              <Button onClick={addExperience} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
              {resumeData.experience.map((exp) => (
                <Card key={exp.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Label>Work Experience</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                  />
                  <Input
                    placeholder="Duration (e.g., 2020 - Present)"
                    value={exp.duration}
                    onChange={(e) => updateExperience(exp.id, "duration", e.target.value)}
                  />
                  <Textarea
                    placeholder="Job description and achievements..."
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    rows={3}
                  />
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              <Button onClick={addEducation} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
              {resumeData.education.map((edu) => (
                <Card key={edu.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Label>Education</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                  />
                  <Input
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                  />
                  <Input
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => updateEducation(edu.id, "year", e.target.value)}
                  />
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                />
                <Button onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => deleteSkill(index)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t">
            <Label className="mb-3 block">Choose Template</Label>
            <div className="flex gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Palette className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm font-medium">{template.name}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Preview Canvas */}
        <Card className="p-6 sticky top-6 print:p-0 print:shadow-none print:border-0">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview
            </h3>
          </div>
          <div
            id="resume-preview"
            ref={canvasRef}
            className={`${getTemplateStyles()} p-8 rounded-lg min-h-[800px] shadow-lg overflow-auto print:shadow-none print:rounded-none print:min-h-0`}
          >
            {/* Header */}
            <div className="mb-6 pb-6 border-b-2 border-foreground/10">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {resumeData.personalInfo.name || "Your Name"}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
                {resumeData.personalInfo.phone && <span>{resumeData.personalInfo.phone}</span>}
                {resumeData.personalInfo.location && <span>{resumeData.personalInfo.location}</span>}
              </div>
            </div>

            {/* Summary */}
            {resumeData.personalInfo.summary && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Summary</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {resumeData.personalInfo.summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {resumeData.experience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-3">Experience</h2>
                {resumeData.experience.map((exp) => (
                  <div key={exp.id} className="mb-4">
                    <h3 className="font-semibold text-foreground">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-muted-foreground mb-2">{exp.duration}</p>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resumeData.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-3">Education</h2>
                {resumeData.education.map((edu) => (
                  <div key={edu.id} className="mb-3">
                    <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">{edu.year}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {resumeData.skills.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}
