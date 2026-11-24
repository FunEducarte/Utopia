import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WorldSelector from './pages/world_Selector';
import AssetForm from './pages/CreateAsset';
import AssetStore from './pages/joinasset';
import CreateMetaverse from './pages/Metaverse';
import WorldNFTs from './components/MapNFT';
import { useEffect } from 'react';
import { bootSpore } from './utopy/bootSpore';
function App() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await bootSpore({
          env: "prod",
          platform: "web",
          token:'utopy-resonancia',
        });
        if (!cancelled) {
          console.log("[FEDA] UTOPY boot OK");
        }
      } catch (e) {
        console.error("[FEDA] bootSpore error:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <Router>
      <Routes>
        {/* Ruta por defecto: cuando accedas a la raíz, redirige al selector de mundos */}
        <Route path="/" element={<Navigate to="/worldselector" />} />

        <Route path="/map" element={<WorldNFTs/>} />
        <Route path="/worldselector" element={<WorldSelector />} />

        {/* Formulario de creación de activos */}
        <Route path="/create-asset" element={<AssetForm />} />

        {/* Tienda de proyectos/activos */}
        <Route path="/join-asset" element={<AssetStore />} />

        <Route path="/metaverse"   element={<CreateMetaverse/>} />
      </Routes>
    </Router>
  );
}

export default App;
