// Feda/src/components/Maincontainer.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiEditLine,
  RiPlayFill,
} from "@remixicon/react";
import styled from "styled-components";
import {
  burnMyNFT,
  getOwnedNFTsByWorldId,
  updateNFTMetadata,
} from "../services/metaverseNFT";
import Footer from "./Footer";
import Header from "./header/header";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { chainIdToNetworkName } from "../utils/chainid";
import { useEthersSigner } from "../services/signer";
import ProjectPage from "./ProjectModal";

// ✅ Config
const MICELIO_HTTP ="http://seed.mterra.space/micelio"; //import.meta.env.VITE_MICELIO_HTTP || "http://

type AnyProject = any;

type MainComponentProps = {
  world?: any;
  user?: any;
};

type NavTarget = string | number;
function smartNavigate(navigate: ReturnType<typeof useNavigate>, to: NavTarget) {
  if (typeof to === "number") navigate(to);
  else navigate(to);
}

// ----------------------------
// Helpers
// ----------------------------
function mergeById(prev: AnyProject[], incoming: AnyProject[]) {
  const map = new Map<string, AnyProject>();
  for (const p of prev) map.set(String(p?.id), p);
  for (const p of incoming) map.set(String(p?.id), p);
  return Array.from(map.values());
}

function normalizeBase(urlLike: string) {
  // permite "/micelio" o "https://x/micelio"
  if (!urlLike) return "/micelio";
  return urlLike.endsWith("/") ? urlLike.slice(0, -1) : urlLike;
}

const MainComponent: React.FC<MainComponentProps> = ({ world }) => {
  const navigate = useNavigate();
  const { address: userAddress } = useAccount();
  const chainid = useChainId();
  const chain = chainIdToNetworkName(chainid);
  const signer = useEthersSigner();

  const micelioBase = useMemo(() => normalizeBase(MICELIO_HTTP), []);

  const worldId = useMemo(() => {
    const wid = world?.worldId ?? world?.id;
    return wid == null ? "" : String(wid);
  }, [world]);

  const [projects, setProjects] = useState<AnyProject[]>([]);
  const [visibleProjects, setVisibleProjects] = useState<AnyProject[]>([]);
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);

  const openMainModal = () => setIsMainModalOpen(true);
  const closeMainModal = () => setIsMainModalOpen(false);
  const showMoreProjects = () => setVisibleProjects(projects);

  const goBack = () =>
    smartNavigate(navigate, window.history.length > 2 ? -1 : "/");

  const handleDelete = async (nftId: any, chainName: string, s: any) => {
    try {
      await burnMyNFT(chainName, s, nftId);
      setProjects((prev) => prev.filter((x: any) => x.id !== nftId));
      setVisibleProjects((prev) => prev.filter((x: any) => x.id !== nftId));
    } catch (error) {
      console.error("❌ Error al eliminar NFT:", error);
    }
  };

  const handleEdit = async (project: any, chainName: string, s: any) => {
    try {
      const newIcon = prompt("🖼️ Nuevo icon URL:", project.icon);
      const newLink = prompt("🔗 Nuevo link URL:", project.linkURL);

      if (newIcon || newLink) {
        const updated = {
          ...project,
          ...(newIcon && { icon: newIcon }),
          ...(newLink && { linkURL: newLink }),
        };

        await updateNFTMetadata(
          chainName,
          s,
          project.id,
          newLink || project.linkURL,
          newIcon || project.icon
        );

        setProjects((prev) => prev.map((p: any) => (p.id === project.id ? updated : p)));
        setVisibleProjects((prev) => prev.map((p: any) => (p.id === project.id ? updated : p)));
      }
    } catch (error) {
      console.error("❌ Error al editar NFT:", error);
    }
  };

  // ----------------------------
  // DV → Project UI
  // ----------------------------
  const dvToProject = useCallback(
    (dv: any) => {
      const id = dv?.id || `dv:${Date.now()}`;
      const attrs = dv?.attrs || {};
      const labels = Array.isArray(dv?.labels) ? dv.labels : [];
      const meta = dv?.meta || {};
      const scopes: string[] = Array.isArray(meta?.scopes) ? meta.scopes : [];

      const icon =
        attrs?.icon ||
        attrs?.image ||
        attrs?.fileUrl ||
        attrs?.sceneUrl ||
        attrs?.sceneURL ||
        attrs?.["mt:media.image"] ||
        world?.icon;

      const sceneUrl = attrs?.sceneUrl || attrs?.sceneURL || attrs?.url || attrs?.fileUrl;
      const title = attrs?.nombre || attrs?.name || labels?.[0] || id;

      return {
        id,
        icon,
        sceneUrl,
        linkURL: attrs?.linkURL || attrs?.url,
        title,
        __dv: dv,
        __source: "dv",
        __scopes: scopes,
      };
    },
    [world?.icon]
  );

  // ----------------------------
  // 0) Evento rápido cuando CreateScene crea DV
  // ----------------------------
  useEffect(() => {
    const onRefresh = async (e: any) => {
      const wid = e?.detail?.worldId;
      if (!wid || !worldId) return;
      if (String(wid) !== String(worldId)) return;

      // pull inmediato micelio
      try {
        const url = new URL(`${micelioBase}/dv`, window.location.origin);
        url.searchParams.set("limit", "80");
        url.searchParams.set("scope", "public");
        url.searchParams.set("worldId", String(worldId));

        const res = await fetch(url.toString());
        if (!res.ok) return;
        const json = await res.json();
        const items: any[] = json?.items || [];

        if (Array.isArray(items) && items.length) {
          const dvProjects = items.map(dvToProject);
          setProjects((prev) => mergeById(prev, dvProjects));
          setVisibleProjects((prev) => mergeById(prev, dvProjects).slice(0, 2));
        }
      } catch {}
    };

    window.addEventListener("utopy:world-refresh", onRefresh as any);
    return () => window.removeEventListener("utopy:world-refresh", onRefresh as any);
  }, [worldId, dvToProject, micelioBase]);

  // ----------------------------
  // 1) NFTs (tu lógica original)
  // ----------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchOwnedNFTs = async () => {
      if (!worldId || !userAddress) return;
      try {
        const nfts = await getOwnedNFTsByWorldId(worldId, userAddress);
        if (cancelled) return;

        setProjects(nfts);
        setVisibleProjects(nfts.slice(0, 2));
      } catch (e) {
        console.error("❌ fetchOwnedNFTs error:", e);
      }
    };

    fetchOwnedNFTs();
    return () => {
      cancelled = true;
    };
  }, [worldId, userAddress]);

  // ----------------------------
  // 2) DV realtime por SSE (Micelio /events)
  // ----------------------------
  useEffect(() => {
    if (!worldId) return;

    let es: EventSource | null = null;

    const connectSSE = () => {
      try {
        const url = new URL(`${micelioBase}/events`, window.location.origin);
        es = new EventSource(url.toString(), { withCredentials: false });

        const onAny = (ev: MessageEvent) => {
          try {
            const msg = JSON.parse(ev.data || "{}");
            const dv = msg?.payload || msg?.dv || msg;
            if (!dv?.id) return;

            // filtrar por world (attrs.worldId o scope world:ID)
            const dvWid = dv?.attrs?.worldId ? String(dv.attrs.worldId) : null;
            const scopes: string[] = Array.isArray(dv?.meta?.scopes) ? dv.meta.scopes : [];
            const hasWorldScope = scopes.includes(`world:${worldId}`);

            if (dvWid && dvWid !== String(worldId)) return;
            if (!dvWid && !hasWorldScope) {
              // si no trae worldId, al menos exigimos scope world:ID
              return;
            }

            const p = dvToProject(dv);
            setProjects((prev) => {
              const exists = prev.some((x: any) => String(x.id) === String(p.id));
              return exists ? prev : [p, ...prev];
            });
            setVisibleProjects((prev) => {
              const exists = prev.some((x: any) => String(x.id) === String(p.id));
              return exists ? prev : [p, ...prev].slice(0, 2);
            });
          } catch {}
        };

        // escuchamos nombres típicos
        es.addEventListener("dato.create", onAny);
        es.addEventListener("dato.update", onAny);
        es.addEventListener("dato.upsert", onAny);

        // si tu bus publica como "hello"/"ping" no pasa nada
        es.onerror = () => {
          try { es?.close(); } catch {}
          es = null;
        };
      } catch {}
    };

    connectSSE();

    return () => {
      try { es?.close(); } catch {}
      es = null;
    };
  }, [worldId, dvToProject, micelioBase]);

  // ----------------------------
  // 3) Fallback polling /dv (por si SSE no llega)
  // ----------------------------
  useEffect(() => {
    if (!worldId) return;

    let alive = true;
    let t: ReturnType<typeof setTimeout> | undefined;

    const pull = async () => {
      if (!alive) return;
      try {
        const url = new URL(`${micelioBase}/dv`, window.location.origin);
        url.searchParams.set("limit", "80");
        url.searchParams.set("scope", "public");
        url.searchParams.set("worldId", String(worldId));

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const items: any[] = json?.items || [];

        if (Array.isArray(items) && items.length) {
          const dvProjects = items.map(dvToProject);
          setProjects((prev) => mergeById(prev, dvProjects));
          setVisibleProjects((prev) => mergeById(prev, dvProjects).slice(0, 2));
        }
      } catch {
        // silencioso
      } finally {
        t = setTimeout(pull, 8000);
      }
    };

    pull();
    return () => {
      alive = false;
      if (t) clearTimeout(t);
    };
  }, [worldId, dvToProject, micelioBase]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <Container>
      <BackButton onClick={goBack} type="button">
        <RiArrowLeftLine size={30} />
      </BackButton>

      <Header />

      {isMainModalOpen && <ProjectPage onClose={closeMainModal} project={world} />}

      <Card $primary onClick={openMainModal}>
        <StyledCard>
          {world?.icon ? <img src={world.icon} alt="Icono del mundo" /> : <h1>Sin proyectos aún</h1>}
        </StyledCard>
      </Card>

      {visibleProjects.map((project: any) => (
        <Card key={String(project.id)}>
          <DeleteButton
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (project.__dv || String(project.id).startsWith("utopy:")) return;
              handleDelete(project.id, chain, signer);
            }}
          >
            <RiCloseLine size={20} />
          </DeleteButton>

          <EditButton
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (project.__dv) return;
              handleEdit(project, chain, signer);
            }}
          >
            <RiEditLine size={20} />
          </EditButton>

          <IconContainer>
            <img src={project.icon} alt="icon" />
          </IconContainer>

          {project.sceneUrl && (
            <PlayButton
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(project.sceneUrl, "_blank", "noopener,noreferrer");
              }}
              title={project.title || "Abrir"}
            >
              <RiPlayFill size={40} />
            </PlayButton>
          )}
        </Card>
      ))}

      {projects.length > 2 && visibleProjects.length <= 2 && (
        <ShowMoreButton type="button" onClick={showMoreProjects}>
          <RiAddLine size={30} />
        </ShowMoreButton>
      )}

      <Footer />
    </Container>
  );
};

// ----------------------------
// Styled components
// ----------------------------
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  height: 100vh;
  width: 100vw;
  position: relative;
`;

// ✅ FIX: tipar prop y usar transient prop ($primary)
type CardProps = {
  $primary?: boolean;
};

const Card = styled.div<CardProps>`
  background: ${(props) => (props.$primary ? "transparent" : "#1a1a1a")};
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  height: 200px;
  position: relative;

  &:hover {
    box-shadow: 0 6px 12px rgba(255, 255, 255, 0.2);

    /* Muestra botones en hover */
    ${"button"} {
      opacity: 1;
    }
  }

  p {
    margin-top: 15px;
    color: #ffffff;
    font-size: 16px;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #ffffff;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StyledCard = styled.div`
  width: 200px;
  height: 200px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    object-fit: contain; /* ✅ FIX: "container" no existe */
  }
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

const BackButton = styled.button`
  position: absolute;
  top: 50%;
  left: 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;

  svg {
    fill: #ff4d4d;
  }

  span {
    margin-left: 8px;
    color: #ff4d4d;
    font-size: 18px;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    fill: red;
  }
`;

const EditButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    fill: white;
  }
`;

const PlayButton = styled.button`
  position: absolute;
  top: 150px;
  right: 80px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  svg {
    fill: green;
  }
`;

export default MainComponent;