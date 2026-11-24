import React from 'react';
import styled, { keyframes } from 'styled-components';
import { RiCloseLine } from '@remixicon/react';
import { useNavigate } from 'react-router-dom';

const Modal = ({ closeModal }) => {
  const navigate = useNavigate();

  const handleCreateAsset = () => {
    navigate('/create-asset');
    closeModal();
  };

  const handleJoinProject = () => {
    navigate(`/join-asset`);
    closeModal();
  };

  return (
    <Overlay onClick={closeModal}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={closeModal}>
          <RiCloseLine size={20} />
        </CloseButton>

        <Option onClick={handleCreateAsset}>
          <img src="/img/OpcionCrear.png" alt="Crear Activo" />
        </Option>
        <Option onClick={handleJoinProject}>
          <img src="/img/OpcionVisualizar.png" alt="Unirse a Proyecto" />
        </Option>
      </ModalContent>
    </Overlay>
  );
};

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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  max-width: 300px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: ${fadeIn} 0.25s ease-out;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #888;
`;

const Option = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
  cursor: pointer;
  transition: transform 0.2s ease;

  img {
    width: 180px;
    height: 180px;
    border-radius: 12px;
    object-fit: cover;
    margin-bottom: 8px;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: #333;
  }

  &:hover {
    transform: scale(1.03);
  }
`;

export default Modal;
