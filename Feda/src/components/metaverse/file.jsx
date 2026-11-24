import { RiCheckLine } from "@remixicon/react";
import React, { useState } from "react";

const LinkUploader = ({ onLinkUpload }) => {
  const [linkUrl, setLinkUrl] = useState("");

  const handleLinkInput = (event) => {
    setLinkUrl(event.target.value);
  };

  const handleConfirmUpload = () => {
    if (linkUrl) {
      onLinkUpload(linkUrl);
    }
  };

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <h2 style={{ marginBottom: "1rem" }}>Ingresar enlace de contenido</h2>
      <input 
        type="text" 
        placeholder="Pega un enlace IPFS o URL aquí"
        value={linkUrl}
        onChange={handleLinkInput}
        style={{ 
          width: "100%", 
          padding: "0.75rem", 
          fontSize: "1rem", 
          borderRadius: "10px", 
          border: "1px solid #ccc",
          marginBottom: "1.5rem"
        }}
      />
      <button 
        onClick={handleConfirmUpload}
        style={{
          backgroundColor: "black",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
        }}
        title="Confirmar enlace"
      >
        <RiCheckLine size={30} color="#fff" />
      </button>
    </div>
  );
};

export default LinkUploader;
