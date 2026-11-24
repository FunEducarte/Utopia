import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styled from "styled-components";

const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`;

// Avatar que actúa como botón de conexión
const AvatarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

// Imagen del perfil
const ProfileImage = styled.img`
  cursor: pointer;
  width: 90px;
  height: 90px;
  border-radius: 50%;
`;


const UserDashboard = () => {
  return (
    <AppContainer>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
          const connected = mounted && account && chain;
          const handleClick = connected ? openAccountModal : openConnectModal;

          return (
            <AvatarButton onClick={handleClick}>
              <ProfileImage src="\img\Hperfil_usuario.png" alt="Perfil" />
            </AvatarButton>
          );
        }}
      </ConnectButton.Custom>
    </AppContainer>
  );
};

export default UserDashboard;
