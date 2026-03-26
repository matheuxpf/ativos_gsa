import { createClient } from '@supabase/supabase-js';

// Substitua com os dados do seu projeto em Project Settings > API
const supabaseUrl = 'https://vwmcudqjhvupasuaagle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bWN1ZHFqaHZ1cGFzdWFhZ2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1MzMsImV4cCI6MjA4NTI2NzUzM30.-_znQxbz-nrNMg9U1VI2SnPAVRyc-bX-khvK1KsSVQw';

export const supabase = createClient(supabaseUrl, supabaseKey);