import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { HRSidebar } from "@/components/HRSidebar";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import Auth from "./pages/Auth";
import EmployeeAuth from "./pages/EmployeeAuth";
import HRAuth from "./pages/HRAuth";
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeSkills from "./pages/employee/Skills";
import EmployeeGoals from "./pages/employee/Goals";
import EmployeeRecommendations from "./pages/employee/Recommendations";
import EmployeeTraining from "./pages/employee/Training";
import EmployeeProfile from "./pages/employee/Profile";
import EmployeeResume from "./pages/employee/Resume";
import HRDashboard from "./pages/hr/Dashboard";
import HREmployees from "./pages/hr/Employees";
import HRAnalytics from "./pages/hr/Analytics";
import HRTraining from "./pages/hr/Training";
import HRReports from "./pages/hr/Reports";
import HRProfile from "./pages/hr/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/employee" element={<EmployeeAuth />} />
          <Route path="/auth/hr" element={<HRAuth />} />
          
          {/* Employee Routes */}
          <Route
            path="/employee/*"
            element={
              <ProtectedRoute requiredRole="employee">
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <EmployeeSidebar />
                    <main className="flex-1 p-6 bg-background">
                      <SidebarTrigger className="mb-4" />
                      <Routes>
                        <Route path="dashboard" element={<EmployeeDashboard />} />
                        <Route path="skills" element={<EmployeeSkills />} />
                        <Route path="goals" element={<EmployeeGoals />} />
                        <Route path="recommendations" element={<EmployeeRecommendations />} />
                        <Route path="training" element={<EmployeeTraining />} />
                        <Route path="resume" element={<EmployeeResume />} />
                        <Route path="profile" element={<EmployeeProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <FloatingChatbot />
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/hr/*"
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <HRSidebar />
                    <main className="flex-1 p-6 bg-background">
                      <SidebarTrigger className="mb-4" />
                      <Routes>
                        <Route path="dashboard" element={<HRDashboard />} />
                        <Route path="employees" element={<HREmployees />} />
                        <Route path="analytics" element={<HRAnalytics />} />
                        <Route path="training" element={<HRTraining />} />
                        <Route path="reports" element={<HRReports />} />
                        <Route path="profile" element={<HRProfile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <FloatingChatbot />
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
