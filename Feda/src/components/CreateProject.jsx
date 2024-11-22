import { useState } from 'react';
import { useEthersSigner } from '../services/Signer';
import { createProjectOnChain } from '../services/assetservice';

const CreateProjectComponent = ({ projectData }) => {
  const signer = useEthersSigner(); // Obtén el signer del usuario conectado
  const [loading, setLoading] = useState(false); // Estado para manejar el loading
  const [error, setError] = useState(null); // Estado para manejar errores
  const [success, setSuccess] = useState(null); // Estado para manejar el éxito

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      setError(null); // Limpiar el estado del error antes de intentar
      setSuccess(null); // Limpiar el éxito antes de intentar

      if (!signer) {
        console.log('Signer:', signer); // Verifica si signer está definido
        throw new Error('Conecta tu wallet');
        
      }

      // Aquí llamas a tu función para crear el proyecto en la blockchain
      const result = await createProjectOnChain(projectData, signer);
      setSuccess('Proyecto creado con éxito');
      console.log('Proyecto creado con éxito:', result);

    } catch (error) {
      setError('Error al crear el proyecto: ' + error.message);
      console.error('Error al crear el proyecto:', error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCreateProject}
        disabled={loading}
      >
        {loading ? 'Creando proyecto...' : 'Crear proyecto'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default CreateProjectComponent;
