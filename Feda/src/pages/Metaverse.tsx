// Feda/src/pages/Metaverse.tsx
import { useEffect, useState } from "react";
import styled from "styled-components";
import MetaverseModal from "../components/metaverse/metaversemodal";
import { useAccount, useChainId } from "wagmi";
import WorldSelector from "./world_Selector";
import CreateScene from "../components/metaverse/createscene";
import { chainIdToNetworkName } from "../utils/chainid";
import Header from "../components/header/header";
import MainComponent from "../components/Maincontainer";

type AnyWorld = any;

const PageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
`;

const PlanetImage = styled.img`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 1003;

  &:hover {
    transform: translateX(-50%) scale(1.1);
  }
`;

const CreateMetaverse = () => {
  const { address } = useAccount();
  const chainid = useChainId();
  const chain = chainIdToNetworkName(chainid);

  // "modal" -> "select" -> "scene" -> "main"
  const [mode, setMode] = useState<"modal" | "select" | "scene" | "main">("modal");
  const [selectedWorld, setSelectedWorld] = useState<AnyWorld | null>(null);

  // Si chain es unknown, igual podés dejar seleccionar asociaciones, pero aviso visual
  useEffect(() => {
    if (chain === "unknown") {
      console.warn("[FEDA] chainIdToNetworkName devolvió unknown, revisa el mapping.");
    }
  }, [chain]);

  if (mode === "modal") {
    return (
      <PageContainer>
        <Header />
        <PlanetImage src="img/isla.png" alt="Planeta" onClick={() => setMode("modal")} />
        <MetaverseModal
          onSelect={() => setMode("select")}
          onClose={() => setMode("select")}
        />
      </PageContainer>
    );
  }

  if (mode === "select" || !selectedWorld) {
    return (
      <WorldSelector
        onSelectWorld={(world) => {
          setSelectedWorld(world);
          setMode("scene");
        }}
      />
    );
  }

  if (mode === "main" && selectedWorld) {
    return <MainComponent world={selectedWorld} user={address} />;
  }

  // mode === "scene"
  return (
    <CreateScene
      world={selectedWorld}
      chain={chain}
      onDone={({ reason }) => {
        console.log("[FEDA] CreateScene done:", reason);
        setMode("main");
      }}
    />
  );
};

export default CreateMetaverse;
