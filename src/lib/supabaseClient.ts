import { createClient, SupabaseClient } from '@supabase/supabase-js'

const projectUrl = import.meta.env.VITE_SUPABASE_PROJECT
const apiKey = import.meta.env.VITE_SUPABASE_APIKEY

export const supabase: SupabaseClient = createClient(projectUrl, apiKey)
