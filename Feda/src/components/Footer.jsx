import React from 'react';
import { Link } from 'react-router-dom';
import "./footer.css"
const Footer = () => {
  return (
    <footer className="footer">
      <Link to="/">
        <img src="/img/Footer.png" alt="Volver al Selector de Mundos" />
      </Link>
    </footer>
  );
};

export default Footer;
