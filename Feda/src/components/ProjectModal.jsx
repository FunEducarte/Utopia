// src/components/ProjectModal.jsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  RiPlayFill,
  RiEditLine,
  RiMapPinLine,
  RiAddCircleLine,
} from "@remixicon/react";
import { useAccount, useChainId } from "wagmi";
import { useEthersSigner } from "../services/signer";
import { updateWorld, syncMyWorlds } from "../services/metaverse";
import {
  approveTokens,
  getStakedAmount,
  stakeTokens,
} from "../services/staking";
import { chainIdToNetworkName } from "../utils/chainid";
import ProjectEditor from "./projecteditor";

const AddressZero = "0x0000000000000000000000000000000000000000";
const LS_ASSOC_KEY = "utopy:feda:associations";

function saveAssociationToLocalStorage(item) {
  try {
    const raw = window.localStorage.getItem(LS_ASSOC_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(prev) ? prev : [];

    // dedupe por id
    const id = item?.id || item?.worldId;
    const next = [
      ...arr.filter((x) => (x?.id || x?.worldId) !== id),
      { ...item, _associatedAt: Date.now() },
    ];

    window.localStorage.setItem(LS_ASSOC_KEY, JSON.stringify(next));

    // Avisar a la app para refrescar inmediatamente
    try {
      window.dispatchEvent(new CustomEvent("utopy:associations:changed"));
    } catch (_) {}
  } catch (e) {
    console.warn("[ProjectModal] No se pudo guardar asociación:", e);
  }
}

const ProjectPage = ({ project, onClose }) => {
  const { address, isConnected } = useAccount();
  const chain = useChainId();
  const signer = useEthersSigner();
  const networkName = chainIdToNetworkName(chain);

  // 🧬 detectar si es territorio MT / espacio vivo
  const isTerritory =
    project?.kind === "territorio" ||
    (Array.isArray(project?.traits) &&
      project.traits.includes("mt:territorio"));

  // nombre / descripción / icono unificados
  const displayName = isTerritory
  ? (project?.labels?.[0] ||
     project?.attrs?.nombre ||
     project?.attrs?.name ||
     "Territorio sin nombre")
  : (project?.labels?.[0] ||
     project?.name ||
     project?.projectTitle ||
     "Mundo sin nombre");

  const displayDescription = isTerritory
    ? project?.attrs?.descripcion || "Sin descripción"
    : project?.description || "Sin descripción";

  const displayIcon = isTerritory
    ? project?.attrs?.media?.image || project?.icon
    : project?.icon;

  const creator = project?.creator;
  const isOwner =
    creator &&
    address &&
    String(creator).toLowerCase() === String(address).toLowerCase();

  const [editing, setEditing] = useState(false);
  const [editedWorlds, setEditedWorlds] = useState({});
  const [stakeAmount, setStakeAmount] = useState("");
  const [showStakeInput, setShowStakeInput] = useState(false);

  const hasStake = stakeAmount && Number(stakeAmount) > 0;

  // 🔹 Para territorios NO intentamos leer staking
  useEffect(() => {
    if (!project || isTerritory) return;

    const fetchStakeAmount = async () => {
      if (
        !project?.stakingAddress ||
        !address ||
        project.stakingAddress === AddressZero ||
        !networkName
      ) {
        console.warn("⚠️ Faltan datos para obtener stakedAmount");
        return;
      }

      try {
        const amount = await getStakedAmount(
          project.stakingAddress,
          address,
          networkName
        );
        setStakeAmount(amount.toString());
        console.log("📊 Tokens stakeados actualmente:", amount.toString());
      } catch (err) {
        console.error("❌ Error al obtener staked amount:", err);
      }
    };

    fetchStakeAmount();
  }, [project, address, chain, isTerritory, networkName]);

  const handleSyncWorld = async (worldId) => {
    try {
      await syncMyWorlds(networkName, signer, worldId, chain);
      setEditedWorlds((prev) => {
        const updated = { ...prev };
        delete updated[worldId];
        return updated;
      });
      alert("✅ Mundo sincronizado correctamente.");
    } catch (err) {
      console.error("❌ Error al sincronizar:", err);
    }
  };

const handleEnterTerritory = () => {
  const id = project?.id || project?.worldId;
  if (!id) return;

  saveAssociationToLocalStorage({
    ...project,
    id,
    kind: project?.kind || project?.with?.kind,
    traits: project?.traits || project?.with?.traits,
    attrs: project?.attrs || project?.with?.attrs,
    meta: project?.meta || project?.with?.meta,
  });

  // ✅ para que lo veas inmediatamente en el selector
  onClose?.();
};



  const handlePlayClick = async () => {
    if (!isConnected) return alert("Conéctate a tu wallet primero.");
    try {
      // solo mundos usan staking
      if (!isTerritory && project.tokenAddress && !hasStake) {
        if (!stakeAmount || isNaN(stakeAmount) || Number(stakeAmount) <= 0) {
          return alert("Ingresá una cantidad válida para stakear.");
        }

        await approveTokens(
          project.tokenAddress,
          project.stakingAddress,
          stakeAmount,
          signer
        );
        await stakeTokens(project.stakingAddress, stakeAmount, signer);
        alert("✅ Stake realizado correctamente.");
        console.log(stakeAmount);

        await updateWorld(
          chainIdToNetworkName(chain),
          signer,
          project.id || project.worldId,
          {
            name: project.name,
            description: project.description,
            icon: project.icon,
          }
        );

        setEditedWorlds((prev) => ({
          ...prev,
          [project.id || project.worldId]: true,
        }));
      } else {
        // entrar al mapa / mundo
        window.open(
          `/map?worldId=${encodeURIComponent(project.id || project.worldId)}`,
          "_blank"
        );
      }
    } catch (error) {
      console.error("Error al ejecutar acción:", error);
      alert("❌ Error al ejecutar la acción del proyecto.");
    }
  };

  const handleStakeMore = () => setShowStakeInput(true);

  const handleConfirmStake = async () => {
    if (!stakeAmount || isNaN(stakeAmount) || Number(stakeAmount) <= 0) {
      return alert("Ingresá una cantidad válida para stakear.");
    }
    try {
      await approveTokens(
        project.tokenAddress,
        project.stakingAddress,
        stakeAmount,
        signer
      );
      await stakeTokens(project.stakingAddress, stakeAmount, signer);
      alert("✅ Stake adicional realizado.");
      setShowStakeInput(false);
      setStakeAmount("");
    } catch (error) {
      console.error("Error al stakear más:", error);
      alert("❌ Error al stakear tokens adicionales.");
    }
  };

  // Campos extra bonitos para territorios
  const barrio = project?.attrs?.barrio || project?.attrs?.ubicacion?.barrio;
  const direccion =
    project?.attrs?.direccion || project?.attrs?.ubicacion?.direccion;
  const practica = project?.attrs?.practica;
  const areaM2 = project?.attrs?.areaM2;

  return (
    <Overlay>
      <Container>
        <Close onClick={onClose}>✕</Close>

        <Header>{displayName}</Header>

        <Card>
          {displayIcon && <Icon src={displayIcon} alt={displayName} />}
          <Description>{displayDescription}</Description>

          {isTerritory && (
            <TerritoryInfo>
              {barrio && (
                <InfoRow>
                  <strong>Barrio:</strong> <span>{barrio}</span>
                </InfoRow>
              )}
              {direccion && (
                <InfoRow>
                  <strong>Dirección:</strong> <span>{direccion}</span>
                </InfoRow>
              )}
              {practica && (
                <InfoRow>
                  <strong>Práctica:</strong> <span>{practica}</span>
                </InfoRow>
              )}
              {areaM2 && (
                <InfoRow>
                  <strong>Área:</strong> <span>{areaM2} m²</span>
                </InfoRow>
              )}
            </TerritoryInfo>
          )}
        </Card>

        <Actions>
          {isTerritory ? (
            // 🔹 Acciones para territorios
            <PrimaryButton onClick={handleEnterTerritory}>
              <RiMapPinLine size={24} /> Ver territorio / asociar
            </PrimaryButton>
          ) : (
            // 🔹 Acciones para mundos (con staking)
            <>
              {!hasStake || showStakeInput ? (
                <>
                  <StakeInput
                    type="number"
                    placeholder="Cantidad a stakear"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                  />
                  <PrimaryButton
                    onClick={
                      showStakeInput ? handleConfirmStake : handlePlayClick
                    }
                  >
                    <RiPlayFill size={30} />{" "}
                    {showStakeInput ? "Confirmar Stake" : "Stake y Entrar"}
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <IconButton
                    onClick={handlePlayClick}
                    title="Ver NFTs del mundo"
                  >
                    <RiMapPinLine size={24} />
                  </IconButton>
                  <IconButton
                    onClick={handleStakeMore}
                    title="Stakear más tokens"
                  >
                    <RiAddCircleLine size={24} />
                  </IconButton>
                  {isOwner && (
                    <IconButton
                      onClick={() => setEditing(true)}
                      title="Editar mundo"
                    >
                      <RiEditLine size={24} />
                    </IconButton>
                  )}
                </>
              )}

              {editing && (
                <ProjectEditor
                  project={project}
                  onCancel={() => setEditing(false)}
                  onSave={async (updatedData) => {
                    try {
                      await updateWorld(
                        chainIdToNetworkName(chain),
                        signer,
                        project.id,
                        updatedData
                      );
                      alert("✅ Proyecto actualizado.");
                      setEditedWorlds((prev) => ({
                        ...prev,
                        [project.id]: true,
                      }));
                      setEditing(false);
                    } catch (err) {
                      console.error("Error al actualizar:", err);
                      alert("❌ Error al actualizar el proyecto.");
                    }
                  }}
                />
              )}
            </>
          )}
        </Actions>

        {!isTerritory && editedWorlds[project.id] && (
          <SyncButton onClick={() => handleSyncWorld(project.id)}>
            🔄 Sincronizar cambios
          </SyncButton>
        )}
      </Container>
    </Overlay>
  );
};

export default ProjectPage;

const TerritoryInfo = styled.div`
  margin-top: 12px;
  text-align: left;
  font-size: 13px;
`;

const InfoRow = styled.div`
  margin-top: 4px;

  strong {
    color: #9ae6b4;
    margin-right: 4px;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Container = styled.div`
  background: #121212;
  color: white;
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  border-radius: 20px;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.4);
  position: relative;
`;

const Close = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
`;

const Header = styled.h2`
  margin-top: 0;
  text-align: center;
  font-size: 1.8rem;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
  gap: 1.5rem;
`;

const Icon = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid white;
`;

const Description = styled.p`
  flex: 1;
  font-size: 0.95rem;
  color: #ccc;
`;

const Actions = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
`;

const StakeInput = styled.input`
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid #ccc;
  background: #1e1e1e;
  color: white;
  width: 180px;
`;

const PrimaryButton = styled.button`
  background: #00c896;
  color: black;
  padding: 0.6rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #00e6a5;
  }
`;

const IconButton = styled.button`
  background: #2a2a2a;
  border: none;
  border-radius: 12px;
  padding: 0.6rem;
  cursor: pointer;
  color: white;

  &:hover {
    background: #404040;
  }
`;

const SyncButton = styled.button`
  margin-top: 1.5rem;
  background: #ffc107;
  color: black;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  cursor: pointer;

  &:hover {
    background: #ffdd57;
  }
`;
