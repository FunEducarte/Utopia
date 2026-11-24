import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiArrowLeftLine, RiText, RiTextSnippet, RiImage2Line, RiVipDiamondFill, RiEdit2Fill, RiCloseFill } from "@remixicon/react";
import CreateProjectComponent from "../components/CreateProject";
import Header from "../components/header/header";
import DNAEditor from "../assets/DNAeditor";
import { EmojiDNAModal } from "../assets/Creador";
import styled from "styled-components";

const CreateAsset = () => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const editorInsertRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "",
    tokenSymbol: "",
    tokenDNA: "",
    decimals: 0,
    totalSupply: 0,
  });

  // Nuevo estado para utopyId y errores de parseo
  const [utopyId, setUtopyId] = useState(null);
  const [parsingError, setParsingError] = useState(null);

    // Parsear ADN cuando tokenDNA cambie
    useEffect(() => {
      async function parseDNA() {
        if (!form.tokenDNA) {
          setUtopyId(null);
          setParsingError(null);
          return;
        }
        try {
          const adn = await Utopy.init(form.tokenDNA);
          setUtopyId(adn.utopyId);
          setParsingError(null);
        } catch (e) {
          setParsingError("Error al parsear el ADN: " + e.message);
          setUtopyId(null);
        }
      }
      parseDNA();
    }, [form.tokenDNA]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]:
        name === "name"
          ? value.substring(0, 20)
          : name === "description"
          ? value.substring(0, 150)
          : name === "tokenSymbol"
          ? value.substring(0, 4)
          : value,
    }));
  };

  const validateForm = () => {
    return (
      form.name &&
      form.description &&
      form.icon &&
      form.tokenSymbol &&
      utopyId && // Validar que el utopyId ya está listo
      Number(form.decimals) > 0 &&
      Number(form.totalSupply) > 0
    );
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep((prevStep) => prevStep + 1);
      } else if (step === 4 && validateForm()) {
        console.log("Todos los campos completados, procediendo a la creación del proyecto.");
        console.log("Datos del formulario:", form);
        console.log("Esta en el paso", step);
      }
    } else {
      alert("Por favor completa todos los campos antes de continuar");
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return form.name !== "" && form.description !== "";
      case 3:
        return form.icon !== "";
      case 4:
        return form.tokenSymbol !== "";
      default:
        return true;
    }
  };

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const [popupInfo, setPopupInfo] = useState(null); // Para el SummaryItem

  const closePopup = () => {
    setPopupInfo(null);
  };

  const showPopup = (key, value, step) => {
    setPopupInfo({ key, value, step });
  };

  const PreviewCard = ({ name, description, icon, tokenSymbol }) => (
    <CardWrapper>
      {icon && <CardIcon src={icon} />}
      <CardTitle>
        {name || "Título del mundo"} {tokenSymbol && <SymbolBadge>{tokenSymbol}</SymbolBadge>}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardWrapper>
  );

  const stars = createStars(100);

  // Construir worldData para blockchain: utopyId como dna
  const worldData = {
    name: form.name,
    description: form.description,
    icon: form.icon,
    tokenSymbol: form.tokenSymbol,
    dna: utopyId,
    decimals: form.decimals,
    totalSupply: form.totalSupply,
  };

  return (
    <>
      <Header />
      <PageWrapper step={step} createStars>
        {stars}
        <BackButton onClick={goBack}>
          <RiArrowLeftLine size={30} />
        </BackButton>
        <FormContainer>
          {step === 1 && (
            <WorldSelectorWrapper>
              <WorldImage onClick={() => setStep(2)}>
                <img src="img/Metaverse.png" alt="Isla" />
              </WorldImage>
              <SecondaryWorldImage onClick={() => (window.location.href = "/metaverse")}>
                <img src="img/isla.png" alt="Metaverso" />
              </SecondaryWorldImage>
            </WorldSelectorWrapper>
          )}

          {step === 2 && (
            <>
              <label>Title</label>
              <InputField
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Título"
                required
              />
              <label>Description</label>
              <InputField
                type="text"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Descripción"
                required
              />
              <PreviewCard
                name={form.name}
                tokenSymbol={form.tokenSymbol}
                description={form.description}
                icon={form.icon}
              />
              <Next onClick={handleNext} />
            </>
          )}

          {step === 3 && (
            <>
              <label>Icon</label>
              <InputField
                type="text"
                name="icon"
                value={form.icon}
                onChange={handleInputChange}
                placeholder="URL Icono"
                required
              />
              <PreviewCard
                name={form.name}
                tokenSymbol={form.tokenSymbol}
                description={form.description}
                icon={form.icon}
              />
              <Next onClick={handleNext} />
            </>
          )}

          {step === 4 && (
            <>
              <DNAEditor
                value={form.tokenDNA || ""}
                onValidParse={(parsed) => {
                  setForm((prev) => ({
                    ...prev,
                    tokenDNA: parsed.json,
                    tokenSymbol: parsed.tokenSymbol || prev.tokenSymbol,
                    totalSupply: parsed.totalSupply || prev.totalSupply,
                    decimals: parsed.decimals || prev.decimals,
                  }));
                }}
                onExternalInsert={(inserterFn) => {
                  editorInsertRef.current = inserterFn;
                }}
              />
              <EmojiDNAModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onGenerate={(yamlString) => {
                  if (editorInsertRef.current) {
                    editorInsertRef.current(yamlString); // ✅ inyecta al editor
                  }
                }}
              />
              <FloatingButton onClick={() => setShowModal(true)}>✨</FloatingButton>

              <PreviewCard
                name={form.name}
                description={form.description}
                icon={form.icon}
                tokenSymbol={form.tokenSymbol}
              />

              <SummaryWrapper>
                <SummaryItem onClick={() => showPopup("Título", form.name, 2)}>
                  <RiText />
                </SummaryItem>
                <SummaryItem onClick={() => showPopup("Descripción", form.description, 2)}>
                  <RiTextSnippet />
                </SummaryItem>
                <SummaryItem onClick={() => showPopup("Icono", form.icon, 3)}>
                  <RiImage2Line />
                </SummaryItem>
                <SummaryItem onClick={() => showPopup("Symbol", form.tokenSymbol, 4)}>
                  <RiVipDiamondFill />
                </SummaryItem>
              </SummaryWrapper>

              {popupInfo && (
                <PopupOverlay onClick={closePopup}>
                  <PopupContent onClick={(e) => e.stopPropagation()}>
                    <EditIcon
                      onClick={() => {
                        setStep(popupInfo.step);
                        closePopup();
                      }}
                    >
                      <RiEdit2Fill size={24} />
                    </EditIcon>
                    <h3>{popupInfo.key}</h3>
                    <pre>{popupInfo.value}</pre>
                    <CloseButton onClick={closePopup}>
                      <RiCloseFill />
                    </CloseButton>
                  </PopupContent>
                </PopupOverlay>
              )}
            </>
          )}

          {parsingError && <p style={{ color: "red" }}>{parsingError}</p>}

          {validateForm() && utopyId && <CreateProjectComponent worldData={worldData} />}
        </FormContainer>
      </PageWrapper>
      <Footer />
    </>
  );
};

export default CreateAsset;

// Estilos
const EditIcon = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  cursor: pointer;
  color: rgb(94, 255, 0);
`;
const FloatingButton = styled.button`
  display: block;
  margin-top: -45px;
  margin-left: auto;
  margin-right: auto; // o margin-right: 0 para derecha
`;


const CardWrapper = styled.div`
  background: rgba(173, 173, 173, 0.95);
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 450px;
  margin-top: 20px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
  text-align: center;
  position: relative;
`;

const CardIcon = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
`;

const CardTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const SymbolBadge = styled.span`
  background-color: #00991f;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 14px;
`;

const CardDescription = styled.p`
  font-size: 16px;
  color: #333;
  margin-top: 5px;
`;

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  background: ${(props) =>
    props.step === 2
      ? "linear-gradient(135deg,rgb(255, 255, 255) 0%, rgb(0, 132, 209) 100%)"
      : "linear-gradient(135deg, rgb(0, 0, 0) 0%, rgb(41, 39, 39) 100%)"};
  position: relative;
  transition: background 0.5s ease;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  margin: auto;
  max-width: 500px;
  padding: 20px;
  border-radius: 10px;
`;

const InputField = styled.input`
  position: relative;
  margin-bottom: 2rem;
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #87ceeb; /* Cambia el color al enfocar */
    box-shadow: 0 0 5px rgba(135, 206, 235, 0.5); /* Sombra azul claro */
  }
`;
const Next = styled(RiSendPlane2Line)`
  position: absolute;
  right: 150px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: violet;
  font-size: 24px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 50%;
  left: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  svg {
    fill: #ff4d4d;
  }

  span {
    margin-left: 8px;
    color: #ff4d4d;
    font-size: 18px;
  }
`;

// Estilos
const WorldSelectorWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  position: relative;
  margin-top: 20px;
`;

const WorldImage = styled.div`
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 15px;
  overflow: hidden;

  img {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 15px;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const SecondaryWorldImage = styled(WorldImage)`
  opacity: 0.6; /* Opacidad para la imagen secundaria */
  &:hover {
    opacity: 1; /* Restaurar opacidad al hacer hover */
  }
`;
// Función para crear estrellas flotantes
const createStars = (count) => {
  let stars = [];
  for (let i = 0; i < count; i++) {
    stars.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
          width: "2px",
          height: "2px",
          backgroundColor: "#fff",
          borderRadius: "50%",
          animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
        }}
      />
    );
  }
  return stars;
};
const SummaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
`;

const SummaryItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 16px;

  i {
    margin-right: 8px;
    font-size: 20px;
    color: rgba(0, 255, 8, 0);
  }

  &:hover {
    background: #e0e0e0;
  }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background: black;
  border-radius: 10px;
  padding: 20px;
  max-width: 400px;
  text-align: center;
  position: relative;
  animation: fadeIn 0.3s ease;

  h3 {
    margin-bottom: 10px;
    font-size: 24px;
  }

  p {
    font-size: 18px;
    color: #555;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;

  i {
    font-size: 24px;
    color: #f44336;
  }
`;
