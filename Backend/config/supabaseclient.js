const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Asegúrate de cargar dotenv

const supabase = createClient(
    "https://uebkyohmhvysljaiopka.supabase.co",
     process.env.SUPABASE_KEY
  );  

module.exports = supabase;
