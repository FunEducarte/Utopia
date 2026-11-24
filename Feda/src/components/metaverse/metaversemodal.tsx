import styled, { keyframes } from "styled-components";

// Animación de lanzamiento retardado
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
`;

// Animación de órbita
const orbitLeft = keyframes`
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(-150px) rotate(360deg); }
`;

const orbitRight = keyframes`
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(150px) rotate(-360deg); }
`;

// Estilos del modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1004;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ModalContent = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Option = styled.div`
  position: absolute;
  cursor: pointer;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }

  &.left {
    animation: ${orbitLeft} 10s linear infinite;
  }

  &.right {
    animation: ${orbitRight} 10s linear infinite;
  }
`;

const OptionImage = styled.img`
  width: 60%;
  height: 60%;
  object-fit: contain;
`;

type Props = {
  onClose: () => void;
  onSelect?: () => void;      // ✅ create flow: modal -> selector
  onGoMap?: () => void;       // ✅ opcional: ir al mapa (route o mode)
};

const MetaverseModal: React.FC<Props> = ({ onClose, onSelect, onGoMap }) => {
  const handleOptionClick = (option: "create" | "map") => {
    if (option === "create") {
      // ✅ en vez de navigate("/metaverse"), avisamos al padre
      if (onSelect) onSelect();
      onClose();
      return;
    }

    if (option === "map") {
      // ✅ si el padre maneja rutas/modo, lo llamamos
      if (onGoMap) onGoMap();
      onClose();
      return;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Option className="left" onClick={() => handleOptionClick("create")}>
          <OptionImage src="img/metaverseisla.png" alt="Crear" />
        </Option>

        <img
          src="img/isla.png"
          alt="Metaverse"
          style={{ width: "200px", height: "200px" }}
        />

        <Option className="right" onClick={() => handleOptionClick("map")}>
          <OptionImage src="img/metaversemapa.png" alt="Mapa" />
        </Option>
      </ModalContent>
    </ModalOverlay>
  );
};

export default MetaverseModal;
