import {
  RiCheckDoubleFill,
  RiCloseFill,
  RiAddFill,
  RiArrowGoBackFill,
  RiDeleteBin2Line,
} from "@remixicon/react";
import { useState } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContainer = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  color: white;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: none;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  ::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const EmojiSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
`;

const EmojiOption = styled.span`
  cursor: pointer;
  font-size: 2rem;
  padding: 8px;
  border-radius: 12px;
  background: ${(props) =>
    props.selected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"};
  transition: 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ActionButton = styled.button`
  background: ${(props) => props.bg || "#2196f3"};
  color: ${(props) => props.color || "white"};
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: 0.2s;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const ActionContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
`;


const ModuleCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 15px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RangeInput = styled.input.attrs({ type: "range" })`
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(
    to right,
    #4caf50 0%,
    #ffeb3b 50%,
    #f44336 100%
  );
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  margin: 10px 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2px solid #333;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2px solid #333;
    cursor: pointer;
  }
`;


export const EmojiDNAModal = ({ open, onClose, onGenerate }) => {
  const [step, setStep] = useState(1);
  const [symbol, setSymbol] = useState("");
  const [Supply, setSupply] = useState("");
  const [Decimals, setDecimals] = useState("");
  const [modules, setModules] = useState([]);
  const [newModuleEmoji, setNewModuleEmoji] = useState("🔥");
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleLink, setNewModuleLink] = useState("");

  const addModule = () => {
    if (!newModuleName || !newModuleLink) return;
    setModules((prev) => [
      ...prev,
      { emoji: newModuleEmoji, name: newModuleName, link: newModuleLink },
    ]);
    setNewModuleEmoji("🔥");
    setNewModuleName("");
    setNewModuleLink("");
  };

  const removeModule = (index) => {
    setModules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const generateYAML = () => {
    const yamlString = `
💰  totalSupply: ${parseInt(Supply)}
🧮 decimals: ${parseInt(Decimals)}
🧬 tokenSymbol: ${symbol}
🏗️ Buildings:
${modules
  .map(
    (m) =>
      `  - ${m.emoji} ${m.name} (${
        m.link.startsWith("ipfs://") ? "Offchain at" : "CustomModule at"
      } ${m.link})`
  )
  .join("\n")}
`.trim();

    if (onGenerate) onGenerate(yamlString);
    onClose();
  };

  if (!open) return null;

  return (
    <Overlay>
      <ModalContainer>
        <CloseButton onClick={onClose}>
          <RiCloseFill size={24} />
        </CloseButton>

        {step === 1 && (
          <>
            <Title>Símbolo</Title>
            <Input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.substring(0, 4))}
              placeholder="Ej: MYT"
            />

            <Title>💰 </Title>
            <RangeInput
              min={1000}
              max={1_000_000_000}
              step={1000}
              value={Supply}
              onChange={(e) => setSupply(Number(e.target.value))}
            />
            <span className="text-sm text-muted-foreground">
              Total Supply: {Supply.toLocaleString()}
            </span>

            <Title>🧮</Title>
            <RangeInput
              min={0}
              max={18}
              step={1}
              value={Decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
            />
            <span className="text-sm text-muted-foreground">
              Decimals: {Decimals}
            </span>

            <ActionContainer>
  <ActionButton
    onClick={() => {
      const isSupplyValid =
        /^\d+$/.test(Supply) && parseInt(Supply) > 0;
      const isDecimalsValid = /^\d+$/.test(Decimals);
      if (symbol && isSupplyValid && isDecimalsValid) {
        setStep(2);
      } else {
        alert("Verifica que totalSupply y decimals sean números válidos");
      }
    }}
    bg="#4caf50"
  >
    <RiCheckDoubleFill />
  </ActionButton>
</ActionContainer>

          </>
        )}

        {step === 2 && (
          <>
            <Title>Buildings</Title>

            <EmojiSelector>
              {["🔥", "🏦", "🧪", "🌐", "⚡", "💧", "🏞️", "🌽"].map((e) => (
                <EmojiOption
                  key={e}
                  onClick={() => setNewModuleEmoji(e)}
                  selected={newModuleEmoji === e}
                >
                  {e}
                </EmojiOption>
              ))}
            </EmojiSelector>

            <Input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              placeholder="Nombre del módulo"
            />
            <Input
              type="text"
              value={newModuleLink}
              onChange={(e) => setNewModuleLink(e.target.value)}
              placeholder="ipfs:// o 0x..."
            />

            <ActionButton
              onClick={addModule}
              disabled={!newModuleName || !newModuleLink}
              bg="#c84900"
            >
              <RiAddFill />
            </ActionButton>

            {modules.length > 0 && (
              <>
                {modules.map((m, idx) => (
                  <ModuleCard key={idx}>
                    <span style={{ fontSize: "1.5rem" }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        {m.link}
                      </div>
                    </div>
                    <button
                      onClick={() => removeModule(idx)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "red",
                      }}
                    >
                      <RiDeleteBin2Line size={20} />
                    </button>
                  </ModuleCard>
                ))}
              </>
            )}

            <div style={{ marginTop: "20px" }}>
              <ActionButton
                onClick={generateYAML}
                disabled={modules.length === 0}
                bg="#e8d102"
              >
                <RiCheckDoubleFill />
              </ActionButton>
              <ActionButton onClick={() => setStep(1)} bg="#757575">
                <RiArrowGoBackFill />
              </ActionButton>
            </div>
          </>
        )}
      </ModalContainer>
    </Overlay>
  );
};
