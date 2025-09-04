import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ugkdbfmgunoktnmbchmh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2RiZm1ndW5va3RubWJjaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDI3NzQsImV4cCI6MjA0MTAxODc3NH0.Ub7YKLKzNqPNLPPKCNKOQJZhJJOLGPZOLGPZOLGPZOL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

