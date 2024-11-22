import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WorldSelector from './pages/world_Selector';
import Creador from './pages/Creador';
import Arte from './pages/Feda';
import Diversion from './pages/Diversion';
import AssetForm from './pages/CreateAsset';
import AssetStore from './pages/joinasset';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta por defecto: cuando accedas a la raíz, redirige al selector de mundos */}
        <Route path="/" element={<Navigate to="/worldselector" />} />
        
        {/* Página de selección de mundos */}
        <Route path="/worldselector" element={<WorldSelector />} />

        {/* Páginas de los mundos */}
        <Route path="/creador" element={<Creador />} />
        <Route path="/arte" element={<Arte />} />
        <Route path="/diversion" element={<Diversion />} />

        {/* Formulario de creación de activos */}
        <Route path="/create-asset" element={<AssetForm />} />

        {/* Tienda de proyectos/activos */}
        <Route path="/join-asset/:world" element={<AssetStore />} />
      </Routes>
    </Router>
  );
}

export default App;
