import React, { useState, useEffect } from 'react'; 
import { RiAddLine, RiCloseLine } from '@remixicon/react';
import styled from 'styled-components';
import Modal from './modal'; 
import { fetchUserProjectsByWorld, leaveProject } from '../services/assetservice';
import { useAuth } from '../auth/auth'; // Importar tu hook de autenticación
import ProjectPage from '../components/ProjectModal'; // Importar el modal del Project Page

const MainContainer = ({ world }) => {
  const { user, status } = useAuth(); // Obtener el user e información de autenticación
  const [projects, setProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]); // Proyectos visibles (los primeros)
  const [selectedProject, setSelectedProject] = useState(null); // Para el proyecto seleccionado
  const [isMainModalOpen, setIsMainModalOpen] = useState(false); // Estado para el modal principal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false); // Estado para el modal de proyectos

  // Obtener los proyectos del usuario cuando cambie el estado de autenticación y el mundo
  useEffect(() => {
    const getProjects = async () => {
      if (status === 'authenticated' && user?.id && world) {
        try {
          const fetchedProjects = await fetchUserProjectsByWorld(user.id, world);
  
          if (Array.isArray(fetchedProjects)) {
            const normalizedProjects = fetchedProjects.map((project) => ({
              id: project.id,
              projectTitle: project.projectTitle || 'Sin título',
              description: project.description || 'Sin descripción',
              icon: project.icon || '/img/default-icon.png',
              mainLink: project.mainLink || '',
              world: project.world,
              platform: project.platform,
            }));
            setProjects(normalizedProjects);
            setVisibleProjects(normalizedProjects.slice(0, 2)); // Mostrar los primeros 2
          } else {
            console.error('Los proyectos recibidos no son un array:', fetchedProjects);
          }
        } catch (error) {
          console.error('Error al obtener los proyectos:', error);
        }
      }
    };
  
    getProjects();
  }, [status, user?.id, world]); // Añadimos user?.id como dependencia
  
  
   // Función para abrir el modal principal
   const openMainModal = () => {
    setIsMainModalOpen(true);
  };

  // Función para cerrar el modal principal
  const closeMainModal = () => {
    setIsMainModalOpen(false);
  };

  // Función para abrir el modal de detalles del proyecto
  const openProjectModal = (projectData) => {
    setSelectedProject(projectData); // Asignar el proyecto seleccionado
    setIsProjectModalOpen(true);
  };

  // Función para cerrar el modal de detalles del proyecto
  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProject(null); // Limpiar el proyecto seleccionado
  };

  // Función para mostrar más proyectos
  const showMoreProjects = () => {
    setVisibleProjects(projects.slice(0, projects.length)); // Mostrar todos los proyectos
  };

  // Función para desunirse de un proyecto
const handleLeave = async (projectId) => {
  try {
    const confirmLeave = window.confirm('¿Estás seguro de que quieres desunirte de este proyecto?');
    if (confirmLeave) {
      await leaveProject(user.id, projectId); // Llamada a la API o contrato inteligente
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== projectId));
      setVisibleProjects((prevVisible) => prevVisible.filter((project) => project.id !== projectId));
      alert('Te has desunido del proyecto exitosamente.');
    }
  } catch (error) {
    console.error('Error al desunirte del proyecto:', error);
    alert('Hubo un error al intentar desunirte del proyecto.');
  }
};


  // Imagenes según el mundo
  const images = {
    arte: '/img/CardFeda.png',
    diversion: '/img/CardDiversion.png',
    creador: '/img/CardCreador.png',
  };

  // Función para truncar el texto si es muy largo
  const truncateText = (text, maxLength) => 
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

  return (
    <Container>
      {/* Modal principal para crear o ver proyectos */}
      {isMainModalOpen && <Modal closeModal={closeMainModal} world={world} />}

      {/* Tarjeta principal para abrir el modal principal */}
      <Card primary onClick={openMainModal}>
        <StyledCard>
          {images[world] ? (
            <img src={images[world]} alt={`Imagen del ${world}`} />
          ) : (
            <h1>No hay proyectos disponibles</h1>
          )}
        </StyledCard>
      </Card>

      {/* Mostrar los proyectos si hay alguno */}
      {visibleProjects.length > 0 &&
        visibleProjects.map((project) => (
          <Card key={project.id} onClick={() => openProjectModal(project)}>
            <DeleteButton onClick={() => handleLeave(project.id)}>
             <RiCloseLine size={20} />
            </DeleteButton>
            <IconContainer>
              <img src={project.icon} alt={project.projectTitle} />
            </IconContainer>
            <p>{truncateText(project.projectTitle, 20)}</p>
            <p>{truncateText(project.description, 20)}</p>
          </Card>
        ))}

      {/* Botón para mostrar más proyectos */}
      {projects.length > 2 && visibleProjects.length <= 2 && (
        <ShowMoreButton onClick={showMoreProjects}>
          <RiAddLine size={30} />
        </ShowMoreButton>
      )}

      {/* Modal del Project Page con detalles */}
      {isProjectModalOpen && selectedProject && (
        <ProjectPage project={selectedProject} onClose={closeProjectModal} />
      )}
    </Container>
  );
};

// Styled components aquí...
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  height: 100vh;
  width: 100vw;
  position: relative;
`;

const Card = styled.div`
  background: ${(props) => (props.primary ? 'trasparent' : '#1a1a1a')};
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  height: 200px;
  position: relative;

  &:hover {
    box-shadow: 0 6px 12px rgba(255, 255, 255, 0.2);

    // Muestra el botón de eliminar en hover
    & > button {
      opacity: 1;
    }
  }

  p {
    margin-top: 15px;
    color: #ffffff;
    font-size: 16px;
  }
`;

// Botón de eliminar (X) en la parte superior derecha de la tarjeta
const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0; // Solo visible en hover
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    fill: red;
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

const StyledCard = styled.div`
  width: 200px;
  height: 200px; 
  img {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    object-fit: container; /* Asegura que la imagen cubra todo el Card */
  }
`;

const ShowMoreButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  position: absolute;
  right: 20px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(255, 0, 128, 0.6);
  }

  svg {
    fill: #ff00ff; 
  }
`;

export default MainContainer;
