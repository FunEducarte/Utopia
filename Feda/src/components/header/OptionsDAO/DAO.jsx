import React, { useState, useEffect, useRef } from 'react';
import { RiMailOpenLine, RiDraftLine, RiFileDownloadLine } from '@remixicon/react';
import styled from 'styled-components';

// Estilos con styled-components
const PopupContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 30px;
  width: 400px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url('/img/worldDAO.png'); /* Fondo espacial */
  background-size: cover;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 999;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;

  button {
    flex: 1;
    margin: 0 10px;
    background-color: #000;
    color: #fff;
    padding: 10px;
    border: none;
    border-radius: 50%; /* Botones redondeados */
    font-size: 16px;
    cursor: pointer;
    width: 70px;
    height: 70px;
    
    &:nth-child(2) {
      background-color: #000;
    }

    &:hover {
      opacity: 0.9;
      background-color: #023EBA;
      background-image: url('/img/world.png'); /* Imagen del mundo al hacer hover */
      background-position: center;
      background-size: cover;
    }
  }
`;

const DownloadLink = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 18px;
  color: #007bff;
  margin-top: 10px;

  svg {
    margin-right: 8px;
  }
`;

const CloseButton = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  font-size: 24px;
  color: #000;
`;

const ImageContainer = styled.img`
  cursor: pointer;
  width: 80px;
  margin: 20px;
  border-radius: 15px;
  &:hover {
    transform: scale(1.05);
    transition: all 0.2s ease-in-out;
  }
`;


const DAOoptions = ({ onClose }) => {
  const daoHausLink = 'https://admin.daohaus.club/#/molochv3/0x89/0x6acd5bfc1f2ffa05f08501063f32b9d43cb27de1'; 
  const popupRef = useRef(null);

  // Detectar clics fuera del popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose(); // Cerrar el popup si se hace clic fuera
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      <Overlay />
      <PopupContainer ref={popupRef}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <ActionButtons>
          <button
            onClick={() => window.open(daoHausLink, '_blank')}
          >
            <RiMailOpenLine size={24} />
          </button>
          <button
            onClick={() => window.open(daoHausLink, '_blank')}
          >
            <RiDraftLine size={24} />
          </button>
        </ActionButtons>
        <DownloadLink 
  href="/Whitepaper FEDA.pdf" 
  target="_blank" 
  rel="noopener noreferrer"
>
  <RiFileDownloadLine size={24} />
  Ver Whitepaper
</DownloadLink>


      </PopupContainer>
    </>
  );
};

// Componente principal que muestra la imagen
const DAOoptionsWrapper = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  return (
    <div>
      {/* Imagen que abre el popup */}
      <ImageContainer
        src="/img/headerDAO.png"
        alt="DAO "
        onClick={togglePopup}
      />
      {isPopupOpen && <DAOoptions onClose={togglePopup} />}
    </div>
  );
};

export default DAOoptionsWrapper;
