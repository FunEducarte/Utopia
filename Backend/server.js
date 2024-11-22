const express = require('express');
const { json } = require('express');
const communityRoutes = require('./routes/communities');
const Project = require("./routes/Project");
const ProjectRoutes = require('./routes/projectsBase');
const { getContractDetails } = require('./controllers/Projects');
require('dotenv').config(); // Asegúrate de que las variables de entorno se carguen
const cors = require('cors');

// Importar el cliente de Supabase desde la configuración
const supabase = require('./config/supabaseclient'); 

// Inicializar la app de Express
const app = express();

// Configurar CORS después de inicializar `app`
app.use(cors({
  origin: '*', // Cambia esto a la URL de tu frontend si es necesario
}));

const port = process.env.PORT || 3000;

// Configurar Express para usar JSON
app.use(json());

// Compartir el cliente de Supabase en `req` para poder usarlo en las rutas
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});
app.get("/api/Project/contractDetails", getContractDetails); 
// Definir las rutas
app.use('/api/communities', communityRoutes);
app.use('/api/Project', Project);
app.use('/api/ProjectRoutes', ProjectRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
