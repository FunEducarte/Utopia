import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 10px;
`;

const Logo = styled.img`
  height: 30px;
  transition: transform 0.3s ease, opacity 0.3s ease;

  &:hover {
    transform: scale(1.05);
    opacity: 0.8;
    cursor: pointer;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <Link to="/">
        <Logo src="/img/Footer.png" alt="Volver al Selector de Mundos" />
      </Link>
    </FooterContainer>
  );
};

export default Footer;
