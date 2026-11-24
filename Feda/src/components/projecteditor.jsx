// components/ProjectEditor.js
import React, { useState } from "react";
import styled from "styled-components";

const ProjectEditor = ({ project, onSave, onCancel }) => {
  const [name, setName] = useState(project.name || "");
  const [description, setDescription] = useState(project.description || "");
  const [icon, setIcon] = useState(project.icon || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      return alert("Por favor, completá todos los campos.");
    }
    onSave({ name, description, icon });
  };

  return (
    <EditorContainer>
      <h3>✏️ Editar Proyecto</h3>
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Nombre del proyecto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type="text"
          placeholder="URL del ícono"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
        />
        <ButtonGroup>
          <PrimaryButton type="submit">💾 Guardar</PrimaryButton>
          <CancelButton type="button" onClick={onCancel}>Cancelar</CancelButton>
        </ButtonGroup>
      </form>
    </EditorContainer>
  );
};

export default ProjectEditor;

// Estilos
const EditorContainer = styled.div`
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background: #f9f9f9;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 8px;
  min-height: 80px;
  margin-bottom: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const PrimaryButton = styled.button`
  padding: 8px 12px;
  background: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
`;

const CancelButton = styled.button`
  padding: 8px 12px;
  background: #aaa;
  color: white;
  border: none;
  cursor: pointer;
`;
