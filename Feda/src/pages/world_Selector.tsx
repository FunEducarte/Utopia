// Feda/src/pages/world_Selector.tsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Header from "../components/header/header";
import { useAccount, useChainId } from "wagmi";
import { getStakedWorlds } from "../services/metaverse";
import { chainIdToNetworkName } from "../utils/chainid";
import Modal from "../components/modal";
import { useEthersSigner } from "../services/signer";
import MainComponent from "../components/Maincontainer";
import { RiAddLine } from "@remixicon/react";

const LS_ASSOC_KEY = "utopy:feda:associations";
const LS_LAST_WORLD = "utopy:feda:lastWorld";

type AnyWorld = Record<string, any>;

function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return (v == null ? fallback : v) as T;
  } catch {
    return fallback;
  }
}

function normalizeWorldOrTerritory(w: AnyWorld): AnyWorld {
  const isTerritory =
    w?.kind === "territorio" ||
    (Array.isArray(w?.traits) && w.traits.includes("mt:territorio")) ||
    (Array.isArray(w?.traits) && w.traits.includes("mt:espacio-vivo"));

  const isOrg =
    w?.kind === "org" ||
    (Array.isArray(w?.traits) && w.traits.includes("mt:org")) ||
    (Array.isArray(w?.traits) && w.traits.includes("mt:almacen"));

  if (!isTerritory && !isOrg) {
    return {
      ...w,
      worldId: w.worldId || w.id,
      icon: w.icon,
      name: w.name || w.projectTitle || "Mundo",
      description: w.description || "Sin descripción",
      isTerritory: false,
      isOrg: false,
    };
  }

  const attrs = w?.attrs || w?.with?.attrs || {};
  const media = attrs.media || {};

  return {
    ...w,
    worldId: w.worldId || w.id,
    icon: media.image || w.icon,
    name:
      attrs.nombre ||
      attrs.name ||
      attrs.titulo ||
      w.name ||
      (isTerritory ? "Territorio vivo" : "Organización"),
    description:
      attrs.descripcion || attrs.description || w.description || "Sin descripción",
    isTerritory,
    isOrg,
  };
}

function mergeById(primary: AnyWorld[], secondary: AnyWorld[]) {
  const map = new Map<string, AnyWorld>();
  (primary || []).forEach((x) => {
    const key = x?.worldId || x?.id;
    if (key) map.set(String(key), x);
  });
  (secondary || []).forEach((x) => {
    const key = x?.worldId || x?.id;
    if (key) map.set(String(key), x);
  });
  return Array.from(map.values());
}

type Props = {
  onSelectWorld?: (world: AnyWorld) => void;
};

const WorldSelector: React.FC<Props> = ({ onSelectWorld }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 });

  const [worlds, setWorlds] = useState<AnyWorld[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<AnyWorld | null>(null);

  // ✅ nuevo: último mundo detectado (pero NO auto-abrimos)
  const [lastWorld, setLastWorld] = useState<AnyWorld | null>(null);
  const [askResume, setAskResume] = useState(false);

  const { address, connector } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner({ chainId });

  const networkName = useMemo(() => chainIdToNetworkName(chainId), [chainId]);

  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [visibleProjects, setVisibleProjects] = useState<AnyWorld[]>([]);

  const readAssociations = () => {
    const raw = window.localStorage.getItem(LS_ASSOC_KEY);
    const arr = safeParseJSON<any[]>(raw || "[]", []);
    return Array.isArray(arr) ? arr : [];
  };

  const refreshWorlds = async () => {
    try {
      // ✅ si la red es unknown, no intentamos on-chain (evita crash)
      if (!networkName || networkName === "unknown") {
        const assoc = readAssociations().map(normalizeWorldOrTerritory);
        setWorlds(assoc);
        setVisibleProjects(assoc.slice(0, 2));
        return;
      }

      const staked = await getStakedWorlds(networkName, signer as any, address as any);
      const stakedNorm = (staked || []).map(normalizeWorldOrTerritory);

      const assoc = readAssociations();
      const assocNorm = (assoc || []).map(normalizeWorldOrTerritory);

      const merged = mergeById(stakedNorm, assocNorm);
      setWorlds(merged);
      setVisibleProjects(merged.slice(0, 2));
    } catch (err) {
      console.error("Error al cargar mundos/territorios:", err);
      try {
        const assoc = readAssociations().map(normalizeWorldOrTerritory);
        setWorlds(assoc);
        setVisibleProjects(assoc.slice(0, 2));
      } catch {}
    }
  };

  useEffect(() => {
    if (signer && address && connector) refreshWorlds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, address, connector, chainId]);

  // ✅ Restore last world (pero NO auto-abrir)
  useEffect(() => {
    if (onSelectWorld) return;

    try {
      const raw = window.localStorage.getItem(LS_LAST_WORLD);
      if (raw) {
        const w = safeParseJSON<any>(raw, null);
        if (w) {
          setLastWorld(w);
          setAskResume(true); // 👈 mostrar banner para continuar
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Go main event (solo modo NO-callback)
  useEffect(() => {
    if (onSelectWorld) return;

    const onGoMain = (ev: Event) => {
      const e = ev as CustomEvent;
      const w = e?.detail?.world;
      if (w) {
        try {
          window.localStorage.setItem(LS_LAST_WORLD, JSON.stringify(w));
        } catch {}
        // ✅ NO auto-open si querés, pero acá normalmente sí queremos
        setSelectedWorld(w);
      }
    };

    window.addEventListener("utopy:go-main", onGoMain as any);
    return () => window.removeEventListener("utopy:go-main", onGoMain as any);
  }, [onSelectWorld]);

  // asociaciones changed
  useEffect(() => {
    const onChanged = () => refreshWorlds();

    window.addEventListener("utopy:associations:changed", onChanged);
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_ASSOC_KEY) onChanged();
      if (e.key === LS_LAST_WORLD && !onSelectWorld) {
        // si cambia el último mundo, solo actualizamos banner
        const raw = window.localStorage.getItem(LS_LAST_WORLD);
        const w = raw ? safeParseJSON<any>(raw, null) : null;
        setLastWorld(w);
        setAskResume(!!w);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("utopy:associations:changed", onChanged);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, address, connector, chainId, onSelectWorld]);

  // mouse smooth
  useEffect(() => {
    let animationFrame: number;

    const updateMousePosition = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    const animate = () => {
      setSmoothMouse((prev) => ({
        x: prev.x + (mouse.x - prev.x) * 0.1,
        y: prev.y + (mouse.y - prev.y) * 0.1,
      }));
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", updateMousePosition);
    animate();

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      cancelAnimationFrame(animationFrame);
    };
  }, [mouse]);

  const openMainModal = () => setIsMainModalOpen(true);
  const closeMainModal = () => setIsMainModalOpen(false);

  const handleWorldClick = (w: AnyWorld) => {
    if (onSelectWorld) {
      onSelectWorld(w);
      return;
    }

    try {
      window.localStorage.setItem(LS_LAST_WORLD, JSON.stringify(w));
    } catch {}
    setSelectedWorld(w);
  };

  const continueLastWorld = () => {
    if (!lastWorld) return;
    setAskResume(false);
    setSelectedWorld(lastWorld);
  };

  const chooseAnotherWorld = () => {
    setAskResume(false);
    // no seteamos selectedWorld, para que muestre selector
  };

  const clearLastWorld = () => {
    try {
      window.localStorage.removeItem(LS_LAST_WORLD);
    } catch {}
    setLastWorld(null);
    setAskResume(false);
  };

  // ✅ si ya se eligió → mostrar MainComponent
  if (!onSelectWorld && selectedWorld) {
    return <MainComponent world={selectedWorld} user={address} />;
  }

  return (
    <>
      <Header />
      <PageWrapper>
       

        <WorldContainer>
          {isMainModalOpen && (
            <ModalWrapper>
              <Modal closeModal={closeMainModal} />
            </ModalWrapper>
          )}

          {/* Mundo creador */}
          <PlanetWrapper
            key="creator"
            style={{
              transform: `rotateX(${-(mouse.y - window.innerHeight / 2) * 0.01}deg)
                          rotateY(${(mouse.x - window.innerWidth / 2) * 0.01}deg)`,
            }}
          >
            <WorldIcon
              src="/img/MundoCreador.png"
              alt="Mundo del Creador"
              $primary
              onClick={openMainModal}
            />
          </PlanetWrapper>

          {/* Mundos + territorios/org asociados */}
          {visibleProjects.map((w) => (
            <PlanetWrapper
              key={String(w.worldId || w.id)}
              style={{
                transform: `rotateX(${-(mouse.y - window.innerHeight / 2) * 0.01}deg)
                  rotateY(${(mouse.x - window.innerWidth / 2) * 0.01}deg)`,
              }}
              onClick={() => handleWorldClick(w)}
              title={w.isTerritory ? "Territorio vivo" : w.isOrg ? "Organización" : "Mundo"}
            >
              <Planet />
              <FloatingIcon src={w.icon} alt={w.name || w.worldId || w.id} />
            </PlanetWrapper>
          ))}
        </WorldContainer>

        <CursorPointer style={{ transform: `translate(${smoothMouse.x}px, ${smoothMouse.y}px)` }} />

        {worlds.length > 2 && visibleProjects.length <= 2 && (
          <ShowMoreButton onClick={() => setVisibleProjects(worlds)}>
            <RiAddLine size={30} />
          </ShowMoreButton>
        )}

        <HelpIcon href="https://docs.utopy.live" target="_blank" rel="noopener noreferrer">
          ?
        </HelpIcon>
      </PageWrapper>
    </>
  );
};

export default WorldSelector;

/* =======================
   STYLES
======================= */

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: linear-gradient(to bottom, rgb(0, 0, 7), rgb(4, 4, 31), rgb(3, 37, 44));
  position: relative;
  perspective: 1000px;
`;

const ModalWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
`;

const Planet = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, #3f51b5, #1a237e);
  box-shadow: 0 0 25px rgba(100, 149, 237, 0.6);
  animation: none;
`;

const FloatingIcon = styled.img`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  padding: 5px;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;

  ${Planet}:hover & {
    transform: translateX(-50%) scale(1.2);
  }
`;

const PlanetWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
`;

const WorldContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  position: relative;
  z-index: 1;
`;

type WorldIconProps = { $primary?: boolean };

const WorldIcon = styled.img<WorldIconProps>`
  width: 120px;
  height: 120px;
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  box-shadow: ${({ $primary }) =>
    $primary ? "0 0 25px rgba(255, 0, 255, 0.55)" : "0px 4px 10px rgba(0,0,0,0.3)"};

  border: ${({ $primary }) => ($primary ? "2px solid rgba(255,255,255,0.35)" : "none")};

  &:hover {
    transform: scale(1.15);
    box-shadow: ${({ $primary }) =>
      $primary ? "0 0 35px rgba(255, 0, 255, 0.75)" : "0px 6px 15px rgba(0,0,0,0.5)"};
  }
`;

const CursorPointer = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.1s ease-out;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7));
`;

const ShowMoreButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ffffff;
  border: none;
  position: absolute;
  right: 20px;
  cursor: pointer;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(255, 0, 128, 0.6);
  }

  svg {
    fill: #ff00ff;
  }
`;

const HelpIcon = styled.a`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid white;
  color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  line-height: 50px;
  cursor: pointer;
  text-decoration: none;
  z-index: 2;
  transition: all 0.3s ease;

  &:hover {
    background-color: white;
    color: #000;
    box-shadow: 0 0 10px white;
  }
`;
