import React, { useState, useEffect } from 'react'; 
import styled from 'styled-components';
import { RiPlayFill, RiEdit2Line,RiUserAddLine } from '@remixicon/react';
import { useAuth } from '../auth/auth';
import { useAccount } from 'wagmi';
import { JoinProject, updateProject, isUserJoined } from '../services/assetservice'; // Importar la nueva función

const ProjectPage = ({ project, onClose }) => {
  const { chain, isConnected } = useAccount();
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(project.projectTitle);
  const [newDescription, setNewDescription] = useState(project.description);
  const [newIconUrl, setNewIconUrl] = useState(project.icon);
  const [newMainLink, setNewMainLink] = useState(project.mainLink);
  const [currentStep, setCurrentStep] = useState(0); // Controla el paso actual


  // Verificar si el usuario ya está unido al proyecto
  useEffect(() => {
    const checkIfJoined = async () => {
      try {
        const response = await isUserJoined(user.id, project.id); // Llamada a tu servicio/API
        setIsJoined(response.joined); // Actualiza el estado según el resultado
      } catch (error) {
        console.error('Error al verificar la unión al proyecto:', error);
      }
    };

    if (user?.id && project?.id) {
      checkIfJoined();
    }
  }, [user?.id, project?.id]);

  // Función para activar el modo edición
  const handleEditClick = () => {
    setEditMode(true);
  };

  const steps = [
    { label: "projectTitle", value: newName, setValue: setNewName },
    { label: "description", value: newDescription, setValue: setNewDescription },
    { label: "icon", value: newIconUrl, setValue: setNewIconUrl },
    { label: "mainLink", value: newMainLink, setValue: setNewMainLink },
  ];
  

  // Función para guardar los cambios de edición
  const handleSaveClick = async () => {
    const updatedProject = {
      projectTitle: newName,
      description: newDescription,
      mainLink: newMainLink,
      icon: newIconUrl
    };
  
    try {
      const response = await updateProject(project.id, updatedProject);  // Mover lógica a assetservice
      if (response.success) {
        console.log('Proyecto actualizado:', response.project);
        setEditMode(false);  // Salir del modo de edición
      } else {
        console.error('Error al actualizar el proyecto:', response.message);
      }
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
    }
  };

  // Función para unirse al proyecto
  const handleJoinProject = async () => {
    try {
      if (!isConnected) {
        alert('Conéctate a tu wallet primero.');
        return;
      }

      const response = await JoinProject(user.id, project.id);  // Asegúrate de usar project.id correctamente
      if (response.success) {
        alert('¡Te has unido al proyecto con éxito!');
        setIsJoined(true);  // Actualiza el estado para indicar que el usuario se ha unido
      } else {
        alert(`Error al unirte al proyecto: ${response.message}`);
      }
    } catch (err) {
      console.error('Error al unirse al proyecto:', err);
      alert('Hubo un error al unirte al proyecto');
    }
  };

  const handlePlayClick = () => {
    if (project && project.mainLink) {
      window.open(project.mainLink, '_blank');
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <CloseButton onClick={onClose}>x</CloseButton>
        <ProjectContent>
          <Title>{project.projectTitle}</Title>
          <Card>
            <img src={project.icon_url} alt={project.projectTitle} />
            <Description>{project.description}</Description>
            
            {!isJoined && <JoinButton onClick={handleJoinProject}>
                <RiUserAddLine size={30} />
              </JoinButton>}

            {isJoined && (
              <EditButton onClick={handleEditClick}>
                <RiEdit2Line size={30} />
              </EditButton>
            )}

            {editMode && (
               <EditForm>
                <CloseEditButton onClick={() => setEditMode(false)}>X</CloseEditButton>
                
                {/* Mostrar solo el paso actual */}
                <label>{steps[currentStep].label}:</label>
                <input
                  value={steps[currentStep].value}
                  onChange={(e) => steps[currentStep].setValue(e.target.value)}
                />

                {/* Botón Continuar o Guardar */}
                {currentStep < steps.length - 1 ? (
                  <ContinueButton onClick={() => setCurrentStep(currentStep + 1)}>
                    ok
                  </ContinueButton>
                ) : (
                  <SaveButton onClick={handleSaveClick}>Guardar Cambios</SaveButton>
                )}
              </EditForm>
            )}
          </Card>

          <PlayButton onClick={handlePlayClick}>
            <RiPlayFill size={50} />
          </PlayButton>
        </ProjectContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ProjectPage;
const ContinueButton = styled.button`
  background-color: #007bff; /* Azul */
  color: #ffffff;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    background-color: #0056b3; /* Azul más oscuro */
  }

  &:active {
    background-color: #004494;
    transform: scale(0.98);
  }
`;

const CloseEditButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;

  &:hover {
    color: #ff4d4d; /* Cambia a rojo al pasar el mouse */
  }
`;


const EditForm = styled.div`
  background-color: #1e1e2f;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: relative;
  z-index: 10;
`;



// Botón de guardar cambios
const SaveButton = styled.button`
  background-color: #4caf50; /* Verde */
  color: #ffffff;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    background-color: #45a049; /* Verde más oscuro */
  }

  &:active {
    background-color: #388e3c;
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #757575;
    cursor: not-allowed;
  }
`;


const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7); /* Fondo oscuro con opacidad */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #121212;
  padding: 20px;
  border-radius: 10px;
  width: 95%; /* Ocupar más del ancho de la pantalla */
  max-width: 700px; /* Un límite mayor para pantallas grandes */
  max-height: 95vh; /* Aumentar altura disponible para el modal */
  overflow-y: auto; /* Activar scroll si excede esta altura */
  position: relative;
  display: flex;
  flex-direction: column;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
`;

const ProjectContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 20px;
`;

const Card = styled.div`
  width: 100%;
  height: 400px;
  background-color: #1a1a1a;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
  margin-bottom: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlayButton = styled.button`
  margin-top: 30px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;

  svg {
    fill: #00ff00; /* Color verde para el botón de play */
  }

  &:hover {
    transform: scale(1.1); /* Efecto al pasar el mouse */
  }
`;

const JoinButton = styled.button`
  position: absolute;
  top: 90%;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  svg {
    fill: #00ff00;
  }
`;

const EditButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  background: transparent;
  border: none;
  cursor: pointer;

  svg {
    fill: #00ff00;
  }

`;

const Description = styled.p`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff;
  font-size: 16px;
  text-align: center;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo gris oscuro con opacidad */
  border-radius: 5px; /* Bordes redondeados */
  z-index: 1; /* Asegura que el texto esté por encima de otros elementos */
`;

