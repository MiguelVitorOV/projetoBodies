import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use a Service Role para evitar erros de permissão no backend

export const supabase = createClient(supabaseUrl, supabaseKey)