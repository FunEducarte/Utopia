import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getProjects } from '../services/assetservice';
import ProjectPage from '../components/ProjectModal';
import Header from '../components/header/header';
import { RiArrowLeftLine } from '@remixicon/react';

const JoinAsset = () => {
  const { chain, isConnected } = useAccount();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState('ethereum');
  const { world } = useParams();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected && chain) {
      setPlatform(chain.name.toLowerCase());
    }
  }, [chain, isConnected]);
  

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await getProjects(platform, world);
        if (!response.success) {
          setError(response.message || 'Error al obtener los proyectos.');
          setAssets([]);
          return;
        }
        setAssets(response.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error al recuperar los proyectos.');
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    if (platform) {
      fetchAssets();
    }
  }, [platform, world]);

  const openModal = (projectData) => {
    setSelectedProject(projectData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const truncateText = (text, maxLength) => 
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1); // Ir a la página anterior en el historial
    } else {
      navigate('/'); // Si no hay historial, navegar a la página principal
    }
  };

  if (loading) return <p>Cargando activos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <>
      <Header />
      <BackButton onClick={goBack}>
        <RiArrowLeftLine size={30} />
      </BackButton>
      <PageWrapper>
        <h1>Proyectos en el mundo {world}</h1>
        <CardContainer>
          {assets.length > 0 ? (
            assets.map((asset) => (
              <Card key={asset.id} onClick={() => openModal(asset)}>
                <IconContainer>
                  <img src={asset.icon} alt={`Icono ${asset.name?.trim()}`} />
                </IconContainer>
                <p>{truncateText(asset.projectTitle, 20)}</p>
                <p>{truncateText(asset.description, 20)}</p>
              </Card>
            ))
          ) : (
            <p>No se encontraron activos para este mundo.</p>
          )}
        </CardContainer>

        {isModalOpen && selectedProject && (
          <ProjectPage
            project={selectedProject}
            onClose={closeModal}
            chain={chain}
            isConnected={isConnected}
          />
        )}
      </PageWrapper>
    </>
  );
};

export default JoinAsset;
// Estilos
const PageWrapper = styled.div`
  padding: 20px;
  text-align: center;
  width: 100vw;
`;

const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

const Card = styled.div`
  background: #1a1a1a;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  height: 200px;

  &:hover {
    box-shadow: 0 6px 12px rgba(255, 255, 255, 0.2);
  }

  p {
    margin-top: 15px;
    color: #ffffff;
    font-size: 16px;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #ffffff;
  border-radius: 50%;
  overflow: hidden; /* Oculta partes de la imagen que sobresalgan */
  
  img {
    width: 100%; /* Ajusta la imagen al tamaño del contenedor */
    height: 100%;
    object-fit: cover; /* Ajusta la imagen sin deformarla */
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 50%;
  left: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  svg {
    fill: #ff4d4d;
  }

  span {
    margin-left: 8px;
    color: #ff4d4d;
    font-size: 18px;
  }
`;
