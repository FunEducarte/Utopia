import React, { useState } from 'react';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import { RiUserLine, RiGroupLine, RiSearchLine, RiArrowLeftLine } from '@remixicon/react';
import Communities from './comunidades';
import styled from 'styled-components';
import Search from './Search';

// Estilos del Popup
const NavBarPopupWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* Fondo opaco */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

// Estilos de la barra de navegación
const NavBar = styled.div`
  background-color: white;
  padding: 16px;
  border-radius: 10px;
  display: flex;
  justify-content: space-around;
`;

// Botones de los iconos
const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: black;
`;

// Contenedor del creador de avatares
const AvatarCreatorContainer = styled.div`
  width: 100%;
  height: 500px;
`;

const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

// Imagen del perfil
const ProfileImage = styled.img`
  cursor: pointer;
  width: 90px;
  height: 90px;
  border-radius: 50%;
`;


// Popup de navegación
const NavBarPopup = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('');

  const handleIconClick = (tab) => setActiveTab(tab);

  return (
    <NavBarPopupWrapper>
      <div>
        <NavBar>
          <IconButton onClick={onClose}>
            <RiArrowLeftLine size={24} />
          </IconButton>
          <IconButton onClick={() => handleIconClick('avatar')}>
            <RiUserLine size={24} />
          </IconButton>
          <IconButton onClick={() => handleIconClick('communities')}>
            <RiGroupLine size={24} />
          </IconButton>
          <IconButton onClick={() => handleIconClick('search')}>
            <RiSearchLine size={24} />
          </IconButton>
        </NavBar>

        {activeTab === 'avatar' && (
          <AvatarCreatorContainer>
            <AvatarCreator subdomain="demo" style={{ width: '100vw', height: '100%', border: 'none' }} />
          </AvatarCreatorContainer>
        )}
        {activeTab === 'communities' && <Communities />}
        {activeTab === 'search' && <Search />}
      </div>
    </NavBarPopupWrapper>
  );
};

// Componente principal del UserDashboard
const UserDashboard = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  return (
    <AppContainer>
      <ProfileImage
        src="\img\Hperfil_usuario.png"
        alt="Perfil"
        onClick={togglePopup}
      />

      {isPopupOpen && <NavBarPopup onClose={togglePopup} />}
    </AppContainer>
  );
};

export default UserDashboard;
