import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  RiCompass3Line,
  RiImageAddFill,
  RiMapPinLine,
  RiArrowGoBackLine,
  RiCheckLine,
  RiCloseFill,
} from "@remixicon/react";

// ✅ helper labels raíz (capa humana opcional)
const mkLabels = (kind, attrs) => {
  const name = attrs?.name || attrs?.nombre;
  if (name) return [String(name)];
  if (kind === "territorio") return ["Territorio"];
  if (kind === "laboratorio") return ["Laboratorio"];
  return ["DatoVivo"];
};

const MintNFTPanel = ({
  fileUrl,
  platform,
  signer,
  worldId,
  mintNFT,
  loading,
  onBack,
  onCreateDatoVivo,
}) => {
  const [latLng, setLatLng] = useState({ lat: "", lng: "" });
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // modo: "nft" o "dato"
  const [mode, setMode] = useState("nft");

  // Campos DV
  const [datoKind, setDatoKind] = useState("laboratorio");
  const [datoName, setDatoName] = useState("");
  const [datoDescription, setDatoDescription] = useState("");
  const [datoTraits, setDatoTraits] = useState("mt:espacio-vivo, mt:lab");

  // scopes/ns editables (pero con defaults sanos)
  const [datoNs, setDatoNs] = useState("mt:feda");
  const [datoScopes, setDatoScopes] = useState(`mt:feda, world:${worldId || "?"}`);

  useEffect(() => {
    if (!fileUrl) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatLng({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("No pudimos obtener tu ubicación automáticamente.");
        setLoadingLocation(false);
      }
    );
  }, [fileUrl]);

  useEffect(() => {
    // mantener scopes sincronizados con el worldId
    if (worldId) setDatoScopes(`mt:feda, world:${worldId}`);
  }, [worldId]);

  const handleMintClick = () => setShowConfirmation(true);

  const confirmMint = async () => {
    try {
      const lat = parseFloat(latLng.lat);
      const lng = parseFloat(latLng.lng);
      if (isNaN(lat) || isNaN(lng)) {
        alert("Latitud/longitud inválidas.");
        return;
      }

      if (mode === "nft") {
        await mintNFT(lat, lng);
        setShowConfirmation(false);
        return;
      }

      // DV mode
      if (!onCreateDatoVivo) {
        alert("No hay handler para onCreateDatoVivo (conecta CreateScene).");
        setShowConfirmation(false);
        return;
      }

      const traits =
        datoTraits
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [];

      const scopes =
        datoScopes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [];

      const attrs = {
        name: datoName || "Nodo vivo sin nombre",
        description: datoDescription || "",
        media: { image: fileUrl },
        location: { lat, lng },
        worldId,
        platform,
      };

      const dv = {
        kind: (datoKind || "nodo-vivo").trim(),
        attrs,
        traits,
        labels: mkLabels(datoKind || "nodo-vivo", attrs), // ✅ NIVEL RAÍZ
        meta: {
          ns: (datoNs || "mt:feda").trim(),
          scopes,
          ts: Date.now(),
        },
      };

      await onCreateDatoVivo(dv);
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error en confirmMint:", err);
      alert("Ocurrió un error al procesar la operación.");
      setShowConfirmation(false);
    }
  };

  if (!fileUrl) return null;

  if (loadingLocation) {
    return (
      <Panel>
        <ConfirmText>
          <RiCompass3Line /> Detectando tu ubicación actual...
        </ConfirmText>
      </Panel>
    );
  }

  const mainButtonLabel =
    mode === "nft" ? "Mintear NFT en esta ubicación" : "Crear DatoVivo aquí";

  const confirmTitle =
    mode === "nft" ? "Confirmar minteo NFT" : "Confirmar creación de DatoVivo";

  return (
    <Panel>
      <Title>
        <RiImageAddFill /> NFT / DatoVivo
      </Title>

      <TabRow>
        <TabButton type="button" $active={mode === "nft"} onClick={() => setMode("nft")}>
          NFT
        </TabButton>
        <TabButton type="button" $active={mode === "dato"} onClick={() => setMode("dato")}>
          DatoVivo
        </TabButton>
      </TabRow>

      <Label>
        <RiMapPinLine /> Latitud
      </Label>
      <Input
        type="number"
        value={latLng.lat}
        onChange={(e) => setLatLng({ ...latLng, lat: e.target.value })}
      />

      <Label>
        <RiMapPinLine /> Longitud
      </Label>
      <Input
        type="number"
        value={latLng.lng}
        onChange={(e) => setLatLng({ ...latLng, lng: e.target.value })}
      />

      {mode === "dato" && (
        <>
          <Label>Kind (ej: laboratorio, escuela, huerta, nodo)</Label>
          <Input
            type="text"
            value={datoKind}
            onChange={(e) => setDatoKind(e.target.value)}
            placeholder="laboratorio"
          />

          <Label>Nombre</Label>
          <Input
            type="text"
            value={datoName}
            onChange={(e) => setDatoName(e.target.value)}
            placeholder="Lab de Biomedicina"
          />

          <Label>Descripción</Label>
          <TextArea
            value={datoDescription}
            onChange={(e) => setDatoDescription(e.target.value)}
            placeholder="Qué es este organismo / función / acuerdos..."
          />

          <Label>Traits (coma)</Label>
          <Input
            type="text"
            value={datoTraits}
            onChange={(e) => setDatoTraits(e.target.value)}
            placeholder="mt:espacio-vivo, mt:lab"
          />

          <Label>meta.ns</Label>
          <Input
            type="text"
            value={datoNs}
            onChange={(e) => setDatoNs(e.target.value)}
            placeholder="mt:feda"
          />

          <Label>meta.scopes (coma)</Label>
          <Input
            type="text"
            value={datoScopes}
            onChange={(e) => setDatoScopes(e.target.value)}
            placeholder={`mt:feda, world:${worldId}`}
          />
        </>
      )}

      <Button onClick={handleMintClick} disabled={loading}>
        {loading ? "Procesando..." : mainButtonLabel}
      </Button>

      <BackButton type="button" onClick={onBack}>
        <RiArrowGoBackLine /> Volver para editar
      </BackButton>

      {showConfirmation && (
        <ConfirmBox>
          <ConfirmText>
            <strong>{confirmTitle}</strong>
          </ConfirmText>
          <ConfirmText>📍 Lat: {latLng.lat}</ConfirmText>
          <ConfirmText>📍 Lng: {latLng.lng}</ConfirmText>
          {mode === "dato" && (
            <>
              <ConfirmText>🧬 Kind: {datoKind || "nodo-vivo"}</ConfirmText>
              <ConfirmText>📛 Nombre: {datoName || "sin nombre"}</ConfirmText>
            </>
          )}
          <IconRow>
            <IconButton type="button" onClick={confirmMint}>
              <RiCheckLine size={28} />
            </IconButton>
            <IconButton type="button" onClick={() => setShowConfirmation(false)}>
              <RiCloseFill size={28} />
            </IconButton>
          </IconRow>
        </ConfirmBox>
      )}
    </Panel>
  );
};

export default MintNFTPanel;
  

/* =================== Estilos básicos =================== */

const Panel = styled.div`
  padding: 16px;
  border-radius: 16px;
  background: #111827;
  color: #e5e7eb;
  max-width: 420px;
  width: 100%;
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-top: 12px;
  margin-bottom: 6px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #020617;
  color: #e5e7eb;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #22c55e;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 70px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #020617;
  color: #e5e7eb;
  font-size: 14px;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: #22c55e;
  }
`;

const Button = styled.button`
  margin-top: 16px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #022c22;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const BackButton = styled.button`
  margin-top: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: transparent;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
`;

const ConfirmBox = styled.div`
  margin-top: 16px;
  padding: 12px;
  border-radius: 12px;
  background: #020617;
  border: 1px solid #4b5563;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  margin: 4px 0;
`;

const IconRow = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const IconButton = styled.button`
  border-radius: 999px;
  border: none;
  padding: 6px;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${({ active }) => (active ? "#22c55e" : "#4b5563")};
  background: ${({ active }) => (active ? "#022c22" : "transparent")};
  color: #e5e7eb;
  font-size: 13px;
  cursor: pointer;
`;

