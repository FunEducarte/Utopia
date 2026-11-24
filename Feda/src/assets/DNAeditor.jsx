// DNAEditor.jsx
import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { dracula } from "@uiw/codemirror-theme-dracula";
import parseToDNA from "../utils/parser"; // tu parser personalizado

const DNAEditor = ({ value, onValidParse, onExternalInsert }) => {
  const [errors, setErrors] = useState([]);
  const [jsonPreview, setJsonPreview] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [input, setInput] = useState(
    value ||
      `🗺️ World: MyWorld\n🧬 tokenSymbol: MYT\n🧮 decimals: 18\n💰 totalSupply: 1000000\n\n🏗️ Buildings:\n  - 🔥 FireStation (Burnable)\n  - 🏦 Bank (Economy)\n  - 🧪 Lab (CustomModule at 0x1234567890abcdef)\n  - 🌐 Dashboard (Offchain at ipfs://Qmabc123def456)`
  );
  

  useEffect(() => {
    if (onExternalInsert) {
      onExternalInsert((yamlString) => {
        setInput(yamlString);
        handleChange(yamlString);
      });
    }
  }, [onExternalInsert]);

  const handleChange = (value) => {
    setInput(value);
    try {
      const parsed = parseToDNA(value); // el parser devuelve JSON estructurado
      const tokenSymbolMatch = value.match(/tokenSymbol:\s*([^\s]+)/);
      const totalSupplyMatch = value.match(/totalSupply:\s*([^\s]+)/);
      const decimalsMatch = value.match(/decimals:\s*([^\s]+)/);

      const tokenSymbol = tokenSymbolMatch ? tokenSymbolMatch[1] : "";
      const totalSupply = totalSupplyMatch ? totalSupplyMatch[1] : "";
      const decimals = decimalsMatch ? decimalsMatch[1] : "";

      setErrors([]);
      setJsonPreview(parsed);

      // Envía un objeto con json + tokenSymbol al padre
      onValidParse({ 
        json: parsed, 
        tokenSymbol,
        totalSupply,
        decimals
      });      
    } catch (err) {
      setErrors([err.message]);
      setJsonPreview(null);
    }
  };

  return (
    <div>
      <CodeMirror
        value={input}
        height="400px"
        width="90vw"
        background="transparent"
        theme={dracula}
        extensions={[yaml()]}
        onChange={handleChange}
      />

      {errors.length > 0 && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <b>Errores de validación:</b>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setShowJson(!showJson)}>
        {showJson ? "X" : "🧬"}
      </button>

      {showJson && jsonPreview && (
        <div
          style={{
            background: "#222",
            color: "#0f0",
            padding: "10px",
            marginTop: "10px",
            maxHeight: "300px",
            overflow: "auto",
            textAlign: "left",
          }}
        >
          <pre>{JSON.stringify(jsonPreview, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DNAEditor;
