import React from 'react';
import Menu from "../header/Menu/menu"
import DAOoptionsWrapper from './OptionsDAO/DAO';
import UserDashboard from './User/UserDashboard';
import styled from 'styled-components';

// Styled-components for layout and positioning
const HeaderContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px; /* Define una altura según tu necesidad */
  background-color: transparent; /* Ajusta según el diseño */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index:1000;
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 90%;
  left: 25%;
  transform: translate(-25%, -90%);
  z-index: 1000; /* Menor z-index para que no sobrepase el perfil */
`;

const AvatarDAOContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserAvatar = styled.div`
  position: absolute;
  top: 90%;
  left: 50%;
  z-index: 1002; /* Superior para que quede por encima de DAOoptions */
`;

const DAOoptions = styled.div`
  position: absolute;
  top: 88%;
  left: 82%;
  z-index: 1001;
  padding: 10px 15px;
  border-radius: 50%; /* DAO redondeado al 50% */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;

`;

const Header = () => {
  return (
    <HeaderContainer>
      <MenuContainer>
        <Menu />
      </MenuContainer>
      <AvatarDAOContainer>
        <UserAvatar>
          <UserDashboard />
        </UserAvatar>
        <DAOoptions>
          <DAOoptionsWrapper />
        </DAOoptions>
      </AvatarDAOContainer>
    </HeaderContainer>
  );
};

export default Header;
