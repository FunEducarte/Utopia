import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_PROJECT_URL,   // Acceso a variables de entorno en Vite
  import.meta.env.VITE_ANON_KEY
);
