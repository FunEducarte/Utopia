import React, { useState } from 'react'; 
import styled from 'styled-components';
import CustomButton from './HamburguerButton'; // Asegúrate de que está correctamente importado
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Estilos del contenedor del menú
const MenuContainer = styled.div`
  position: absolute;
  top: 50px;
  right: 20px;
  background-color: transparent;
  width: 220px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transform: ${({ isOpen }) => (isOpen ? 'translateY(0)' : 'translateY(-10px)')};
  transition: all 0.3s ease-in-out;
`;

// Estilos de los ítems dentro del menú (puedes agregar más ítems aquí si es necesario)
const MenuItem = styled.div`
  padding: 10px 20px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

// Componente principal del menú
const Menu = () => {
  const [isOpen, setIsOpen] = useState(false); // Estado para abrir/cerrar menú

  // Alterna el estado del menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <CustomButton isOpened={isOpen} toggleMenu={toggleMenu} /> {/* HamburguerButton con props */}
      <MenuContainer isOpen={isOpen}>
        <MenuItem>
          <ConnectButton/>
        </MenuItem>
      </MenuContainer>
    </>
  );
};

export default Menu;

