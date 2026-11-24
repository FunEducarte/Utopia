import { useState } from 'react';
import { useEthersSigner } from '../services/signer';
import { createWorld } from '../services/metaverse';
import { useChainId } from 'wagmi';
import ConfettiButton from './buttonconf';

const chainIdToName = {
  43113: "fuji",
  1: 'ethereum',
  137: 'polygon',
  56: 'bsc',
  97:'tBNB',
  80002: 'amoy',
  43114: 'avalanche',
  10: 'optimism',
  42161: 'arbitrum',
  11155111: 'sepolia',
};

const CreateProjectComponent = ({ worldData }) => {
  const signer = useEthersSigner();
  const chain = useChainId();
  const networkName = chainIdToName[chain];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false); // solo booleano

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!signer) {
        throw new Error('Conecta tu wallet');
      }

      const result = await createWorld(networkName, signer, worldData);
      setSuccess(true);
      console.log("Datos enviados:", worldData);
      console.log('Proyecto creado con éxito:', result);
      console.log('Chain ID:', chain);
      console.log('Network Name:', networkName);
    } catch (error) {
      setError('Error al crear el proyecto: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ConfettiButton
        onClick={handleCreateProject}
        loading={loading}
        success={success}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CreateProjectComponent;
