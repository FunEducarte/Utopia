// Feda/src/components/metaverse/createscene.tsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { mintNFT } from "../../services/metaverseNFT";
import LinkUploader from "./file";
import MintNFTPanel from "./Mintnftpanel";
import Footer from "../Footer";
import { useEthersSigner } from "../../services/signer";
import WelcomeMessage from "./mensaje";
import Header from "../header/header";

// ✅ publicar DV
import { publishDatoVivo, type DatoVivo } from "../../utopy/dv.publish";

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, rgb(88, 88, 88), rgb(160, 160, 160));
`;

const GlassBox = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 40px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 520px;
  width: 90%;
`;

type WorldLike = {
  worldId?: string | number;
  id?: string | number;
  stakingAddress?: string;
  [k: string]: any;
};

type CreateSceneProps = {
  world: WorldLike; // ✅ objeto completo
  chain: string;    // "polygon" | "bsc" | ...
  // ✅ callback para volver al Main
  onDone?: (info: { reason: "nft.minted" | "dv.created"; world: WorldLike; dvId?: string | null }) => void;
};

const CreateScene: React.FC<CreateSceneProps> = ({ world, chain, onDone }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const signer = useEthersSigner();

  const worldId = useMemo(() => {
    const wid = world?.worldId ?? world?.id;
    return wid == null ? "" : String(wid);
  }, [world]);

  const handleBackToEdit = () => setFileUrl(null);

  const done = (reason: "nft.minted" | "dv.created", dvId?: string | null) => {
    // ✅ este flujo NO depende de eventos
    if (onDone) onDone({ reason, world, dvId: dvId ?? null });
  };

  // ✅ 1) Mint NFT (on-chain)
  const handleMintNFT = async (lat: number, lng: number) => {
    if (!fileUrl || !signer || !worldId || lat == null || lng == null) return;

    try {
      setMinting(true);

      await mintNFT(chain, signer, worldId, lat, lng, fileUrl);

      alert("✅ NFT minteado con éxito");
      setFileUrl(null);

      done("nft.minted");
    } catch (err: unknown) {
      const e = err as any;
      console.error("❌ Error detallado al mintear NFT:", e);
      alert("❌ Error al mintear NFT: " + (e?.reason || e?.message || "Error desconocido"));
    } finally {
      setMinting(false);
    }
  };

  // ✅ 2) Crear DatoVivo (off-chain)
  const handleCreateDatoVivo = async (dv: DatoVivo) => {
    if (!worldId) return;

    try {
      setMinting(true);

      const next: DatoVivo = {
        ...dv,
        attrs: {
          ...(dv.attrs || {}),
          worldId,
          platform: chain,
          fileUrl:
            (dv as any)?.attrs?.fileUrl ||
            fileUrl ||
            (dv as any)?.attrs?.url ||
            (dv as any)?.attrs?.sceneUrl ||
            (dv as any)?.attrs?.sceneURL,
        },
        meta: {
          ...(dv.meta || {}),
          ns: dv?.meta?.ns || "mt:feda",
          scopes: Array.from(
            new Set([...(dv?.meta?.scopes || []), "public", "mt:feda", `world:${worldId}`])
          ),
          ts: dv?.meta?.ts || Date.now(),
        },
      };

      await publishDatoVivo(next);

      alert("✅ DatoVivo creado (sembrado) con éxito");
      setFileUrl(null);

      done("dv.created", (next as any)?.id ?? null);
    } catch (err: unknown) {
      const e = err as any;
      console.error("❌ Error al crear DatoVivo:", e);

      // 👇 MUY útil: si viene 401/unauthorized lo vas a ver acá
      alert("❌ Error al crear DatoVivo: " + (e?.message || e?.error || "Error desconocido"));
    } finally {
      setMinting(false);
    }
  };

  return (
    <Container>
      <Header />
      <GlassBox>
        <WelcomeMessage worldName={worldId || "World"} />

        {!fileUrl ? (
          <LinkUploader onLinkUpload={setFileUrl} />
        ) : (
          <MintNFTPanel
            fileUrl={fileUrl}
            mintNFT={handleMintNFT}
            loading={minting}
            platform={chain}
            signer={signer}
            worldId={worldId}
            onBack={handleBackToEdit}
            onCreateDatoVivo={handleCreateDatoVivo}
          />
        )}
      </GlassBox>
      <Footer />
    </Container>
  );
};

export default CreateScene;
