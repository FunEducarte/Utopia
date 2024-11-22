// Modal.jsx 
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { RiCloseLine } from '@remixicon/react';
import { useNavigate } from 'react-router-dom';


const Modal = ({ closeModal, world }) => {
  const navigate = useNavigate();

  const handleCreateAsset = () => {
    navigate('/create-asset');
    closeModal();
  };

  const handleJoinProject = () => {
    // Aquí usamos el valor real de world
    navigate(`/join-asset/${world}`);
    closeModal();
  };

  return (
    <Overlay onClick={closeModal}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={closeModal}>
          <RiCloseLine size={24} />
        </CloseButton>

        <Option onClick={handleCreateAsset}>
          <img src="/img/OpcionCrear.png" alt="Crear Activo" />
          <p>Create Asset</p>
        </Option>
        <Option onClick={handleJoinProject}>
          <img src="/img/OpcionVisualizar.png" alt="Unirse a Proyecto" />
          <p>Join Project</p>
        </Option>
      </ModalContent>
    </Overlay>
  );
};

// Keyframes para animar la apertura del modal
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const Option = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;

  img {
    width: 350px;
    height: 350px;
    margin-bottom: 10px;
  }

  p {
    margin: 0;
  }

  &:hover {
    transform: scale(1.05);
  }
`;

export default Modal;
