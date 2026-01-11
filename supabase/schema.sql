-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT DEFAULT 'Recruit',
    preferences JSONB DEFAULT '{"mode": "home", "notifications": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions table (tracks each "target")
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_name TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'sighting' CHECK (stage IN ('sighting', 'blanket', 'physical')),
    mode TEXT NOT NULL DEFAULT 'home' CHECK (mode IN ('home', 'away')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (chat history per mission)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mugu checks table (tracks flagged messages)
CREATE TABLE public.mugu_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    is_mugu BOOLEAN NOT NULL,
    correction TEXT,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mugu_checks ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Missions policies
CREATE POLICY "Users can CRUD own missions" ON public.missions
    FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can CRUD messages in own missions" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.missions 
            WHERE missions.id = messages.mission_id 
            AND missions.user_id = auth.uid()
        )
    );

-- Mugu checks policies
CREATE POLICY "Users can CRUD own mugu checks" ON public.mugu_checks
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_missions_user_id ON public.missions(user_id);
CREATE INDEX idx_missions_is_active ON public.missions(is_active);
CREATE INDEX idx_messages_mission_id ON public.messages(mission_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER missions_updated_at
    BEFORE UPDATE ON public.missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to create public.users entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
