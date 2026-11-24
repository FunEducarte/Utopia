import React from 'react';
import styled, { keyframes } from 'styled-components';
import confetti from 'canvas-confetti';
import { RiCheckLine, RiSendPlaneLine } from '@remixicon/react';

// Animación de ola para los puntitos
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); } 
  40% { transform: scale(1); }
`;

const DotContainer = styled.span`
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-left: 10px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite;
  animation-delay: ${({ delay }) => delay}s;
`;

const pop = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const Button = styled.button`
  background-color: ${({ success }) => (success ? '#00c853' : 'transparent')};
  color: white;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${({ animate }) => animate && pop} 0.3s ease;
  box-shadow: ${({ success }) =>
    success ? '0 0 20px rgba(0, 200, 83, 0.6)' : 'none'};

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }
`;

const ConfettiButton = ({ onClick, loading, success }) => {
  const [animate, setAnimate] = React.useState(false);

  const handleClick = () => {
    if (!loading) {
      onClick();
      if (!success) return;
      setAnimate(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => setAnimate(false), 300);
    }
  };

  return (
    <Button success={success} animate={animate} onClick={handleClick}>
      {loading ? (
        <>
          <DotContainer>
            <Dot delay={0} />
            <Dot delay={0.2} />
            <Dot delay={0.4} />
          </DotContainer>
        </>
      ) : success ? <RiCheckLine/> : <RiSendPlaneLine/>}
    </Button>
  );
};

export default ConfettiButton;
