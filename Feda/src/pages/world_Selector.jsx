import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../components/header/header';
// Estilos utilizando styled-components
const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Asegura que ocupa toda la altura de la pantalla */
  width: 100vw;  /* Asegura que ocupa todo el ancho de la pantalla */
`;

const WorldContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px; /* Espacio entre los íconos */
`;

const WorldIcon = styled.img`
  width: 120px;
  height: 120px;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.15); /* Efecto de ampliación al pasar el mouse */
    box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5); /* Más sombra al hacer hover */
  }
`;

const WorldSelector = () => {
  return (
    <>
    <Header/>
    <PageWrapper>
      <WorldContainer>
        <Link to="/arte">
          <WorldIcon src="/img/MundoArte.png" alt="Mundo del Arte" />
        </Link>
        <Link to="/diversion">
          <WorldIcon src="/img/Mundodiversion.png" alt="Mundo de la Diversión" />
        </Link>
        <Link to="/creador">
          <WorldIcon src="/img/MundoCreador.png" alt="Mundo del Creador" />
        </Link>
      </WorldContainer>
    </PageWrapper>
    </>
  );
};

export default WorldSelector;
