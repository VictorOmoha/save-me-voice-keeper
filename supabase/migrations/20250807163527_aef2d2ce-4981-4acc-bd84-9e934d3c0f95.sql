-- Create search analytics table for tracking user search behavior
CREATE TABLE public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_result_id UUID,
  search_type TEXT NOT NULL DEFAULT 'text', -- text, voice, semantic
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search analytics" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create search preferences table
CREATE TABLE public.search_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_categories TEXT[] DEFAULT '{}',
  search_suggestions_enabled BOOLEAN DEFAULT true,
  voice_search_enabled BOOLEAN DEFAULT true,
  semantic_search_enabled BOOLEAN DEFAULT true,
  auto_complete_enabled BOOLEAN DEFAULT true,
  recent_searches_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search preferences" 
ON public.search_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search preferences" 
ON public.search_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search preferences" 
ON public.search_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_search_analytics_user_id ON public.search_analytics(user_id);
CREATE INDEX idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON public.search_analytics(created_at);

-- Create trigger for search_preferences updated_at
CREATE TRIGGER update_search_preferences_updated_at
BEFORE UPDATE ON public.search_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();