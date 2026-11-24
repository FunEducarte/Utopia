import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const messages = [
  "Bienvenido al mundo",
  "Welcome to the world",
  "Bienvenue dans le monde",
  "Willkommen in der Welt",
  "Benvenuto nel mondo",
  "Bem-vindo ao mundo",
  "世界へようこそ" // Japonés
];

const fade = keyframes`
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(10px); }
`;

const Message = styled.h1`
  font-size: 22px; /* 👈 Mucho más pequeño */
  color: #333; /* 👈 Color oscuro, mejor contraste */
  text-align: center;
  animation: ${fade} 4s ease-in-out infinite;
  margin-bottom: 10px;
`;

const WorldName = styled.span`
  display: block;
  font-size: 14px; /* 👈 WorldId más pequeñito */
  color: #666; /* 👈 Gris claro para no competir con el título */
  margin-top: 5px;
`;

const WelcomeMessage = ({ worldName }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Message>{messages[index]}</Message>
      <WorldName>{worldName}</WorldName>
    </>
  );
};

export default WelcomeMessage;
