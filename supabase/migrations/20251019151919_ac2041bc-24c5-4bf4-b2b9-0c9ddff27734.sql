-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('employee', 'hr_admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create career goals table
CREATE TABLE public.career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  target_role TEXT,
  timeline TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('skill', 'training', 'career_path')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training programs table
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration TEXT,
  provider TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee training enrollments table
CREATE TABLE public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completion_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed'))
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "HR admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "HR admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for skills
CREATE POLICY "Users can manage their own skills"
  ON public.skills FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "HR admins can view all skills"
  ON public.skills FOR SELECT
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for career goals
CREATE POLICY "Users can manage their own goals"
  ON public.career_goals FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "HR admins can view all goals"
  ON public.career_goals FOR SELECT
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.recommendations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own recommendations"
  ON public.recommendations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "HR admins can manage all recommendations"
  ON public.recommendations FOR ALL
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for training programs
CREATE POLICY "Everyone can view training programs"
  ON public.training_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR admins can manage training programs"
  ON public.training_programs FOR ALL
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- RLS Policies for training enrollments
CREATE POLICY "Users can manage their own enrollments"
  ON public.training_enrollments FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "HR admins can view all enrollments"
  ON public.training_enrollments FOR SELECT
  USING (public.has_role(auth.uid(), 'hr_admin'));

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_career_goals_updated_at
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Create trigger to handle new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();