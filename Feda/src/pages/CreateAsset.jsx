import React, { useState } from 'react';
import styled from 'styled-components'; 
import CreateProjectComponent from '../components/CreateProject'; // Importamos el nuevo componente
import Header from '../components/header/header';
import Footer from '../components/Footer';

const CreateAsset = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    projectTitle: '',
    description: '',
    icon: '',
    mainLink: '',
    world: '',
    platform: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]:
        name === 'projectTitle'
          ? value.substring(0, 20) // Limitar título a 20 caracteres
          : name === 'description'
          ? value.substring(0, 150) // Limitar descripción a 100 caracteres
          : value, // Para otros campos, usar el valor completo
    }));
  };
  const handleNext = () => {
  // Llama a la validación específica del paso actual antes de avanzar
  if (validateStep()) {
    if (step < 5) {
      setStep((prevStep) => prevStep + 1);
    } else if (step === 5 && validateForm()) {
      console.log("Todos los campos completados, procediendo a la creación del proyecto.");
    }
  } else {
    alert("Por favor completa todos los campos antes de continuar");
  }
};

// Función para validar los campos por paso
const validateStep = () => {
  switch (step) {
    case 1:
      return form.projectTitle !== '';
    case 2:
      return form.description !== '';
    case 3:
      return form.icon !== '';
    case 4:
      return form.mainLink !== '';
    case 5:
      return form.world !== '' && form.platform !== '';
    default:
      return true;
  }
};

// La función completa para validar todos los campos
const validateForm = () => {
  return form.projectTitle && form.description && form.icon && form.mainLink && form.world && form.platform;
};


  return (
    <>
    <Header/>
    <PageWrapper>
      {createStars(50)} {/* Función para crear estrellas de fondo */}
      <FormContainer>
        {step === 1 && (
          <>
            <label>Titulo</label>
            <InputField
              type="text"
              name="projectTitle"
              value={form.projectTitle}
              onChange={handleInputChange}
              placeholder="Ingresa el título del activo"
              required
            />
            <Button onClick={handleNext}>Siguiente</Button>
          </>
        )}

        {step === 2 && (
          <>
            <label>Descripción</label>
            <InputField
              type="text"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Describe tu activo"
              required
            />
            <Button onClick={handleNext}>Siguiente</Button>
          </>
        )}

        {step === 3 && (
          <>
            <label>URL del Icono</label>
            <InputField
              type="url"
              name="icon"
              value={form.icon}
              onChange={handleInputChange}
              placeholder="Ingresa la URL del icono del activo"
              required
            />
            <Button onClick={handleNext}>Siguiente</Button>
          </>
        )}

        {step === 4 && (
          <>
            <label>Enlace Principal</label>
            <InputField
              type="text"
              name="mainLink"
              value={form.mainLink}
              onChange={handleInputChange}
              placeholder="Enlace principal del activo"
              required
            />
            <Button onClick={handleNext}>Siguiente</Button>
          </>
        )}

        {step === 5 && (
          <>
            <label>Mundo</label>
            <SelectField
              name="world"
              value={form.world}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona un mundo</option>
              <option value="diversion">Diversión</option>
              <option value="arte">Arte</option>
              <option value="creador">Creador</option>
            </SelectField>
            <label>Plataforma</label>
            <SelectField
              name="platform"
              value={form.platform}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona una plataforma</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="amoy">amoy</option>
            </SelectField>
            
            {/* Componente para crear el proyecto en la blockchain */}
            {validateForm() && <CreateProjectComponent projectData={form} />}
          </>
        )}
      </FormContainer>
    </PageWrapper>
    <Footer/>
    </>
  );
};


export default CreateAsset;

// Estilos
const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  background: linear-gradient(135deg, #282c34 0%, #191919 100%);
  position: relative;
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
  margin-bottom: 20px;
  padding: 10px;
  width: 100%;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  color: #000;
`;

const SelectField = styled.select`
  margin-bottom: 20px;
  padding: 10px;
  width: 100%;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  color: #000;
`;

const Button = styled.button`
  background-color: #00991f;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #02330c;
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
          position: 'absolute',
          top: `${Math.random() * 100}vh`,
          left: `${Math.random() * 100}vw`,
          width: '2px',
          height: '2px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
        }}
      />
    );
  }
  return stars;
};
