import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Shield, TrendingUp, Target, ArrowRight, Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
                <Briefcase className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CareerPath
              </h1>
            </div>
            
            <p className="text-2xl sm:text-3xl font-semibold text-foreground max-w-3xl mx-auto leading-tight">
              Empower Every Career with AI-Driven Growth
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your workforce with intelligent career development tools powered by advanced AI
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Personalized Development</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered recommendations tailored to individual career goals and skill levels
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors">
              <div className="p-3 bg-accent/10 rounded-lg shrink-0">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Smart Skill Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Identify skill gaps and receive targeted training suggestions for continuous growth
                </p>
              </div>
            </div>
          </div>

          {/* Portal Selection Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-primary mb-3">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">Choose Your Portal</span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Select how you want to continue</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Employee Portal Card */}
              <Card 
                className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-gradient-card"
                onClick={() => navigate("/auth/employee")}
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <Briefcase className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">Employee Portal</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Access your personalized career development dashboard with AI-powered insights
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <Button 
                    className="w-full group-hover:shadow-md transition-shadow" 
                    size="lg"
                  >
                    Employee Login
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Perfect for team members seeking career growth
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* HR Admin Portal Card */}
              <Card 
                className="group relative overflow-hidden border-2 hover:border-accent transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-gradient-card"
                onClick={() => navigate("/auth/hr")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-4 bg-accent/10 rounded-xl group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                      <Shield className="h-8 w-8 text-accent group-hover:text-accent-foreground transition-colors" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">HR Admin Portal</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Manage your workforce with powerful analytics and comprehensive reporting tools
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-2">
                  <Button 
                    className="w-full group-hover:shadow-md transition-shadow" 
                    size="lg"
                    variant="secondary"
                  >
                    HR Admin Login
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Designed for HR professionals and administrators
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Secure authentication • Enterprise-grade privacy • 24/7 support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;