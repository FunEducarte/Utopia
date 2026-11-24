import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/header/header";
import Footer from "./Footer";
import L from "leaflet";
import { getAllNFTsByWorldId } from "../services/metaverseNFT";
import { RiArrowLeftLine } from "@remixicon/react";

// ✅ nuevo: escuchar DVs via WS (simple, sin depender de “mind”)
const DV_WS_URL = "wss://seed.mterra.space/utopy?ns=mt&client=feda-web";

// helper: intenta sacar dv desde mensajes tipo ack/echo o items
function extractDVs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (raw.dato) return [raw.dato];
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.ack && typeof raw.echo === "string") {
    try { return [JSON.parse(raw.echo)]; } catch { return []; }
  }
  if (raw.kind && raw.attrs) return [raw];
  return [];
}

function isDVForWorld(dv, worldId) {
  const wid = dv?.attrs?.worldId || dv?.with?.attrs?.worldId;
  return String(wid || "") === String(worldId || "");
}

const WorldNFTs = () => {
  const [searchParams] = useSearchParams();
  const worldId = searchParams.get("worldId");

  const [nfts, setNfts] = useState([]);
  const [dvs, setDvs] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const goBack = () => navigate(window.history.length > 2 ? -1 : "/");

  // NFTs
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!worldId) return;
      const result = await getAllNFTsByWorldId(worldId);
      setNfts(result || []);
    };
    fetchNFTs();
  }, [worldId]);

  // ✅ DVs en vivo por WS (filtrados por attrs.worldId)
  useEffect(() => {
    if (!worldId) return;

    let ws;
    let alive = true;
    const seen = new Map(); // id -> dv

    function mergeIncoming(list) {
      list.forEach((dv) => {
        const id = dv?.id || JSON.stringify(dv);
        seen.set(String(id), dv);
      });
      setDvs(Array.from(seen.values()));
    }

    try {
      ws = new WebSocket(DV_WS_URL);

      ws.addEventListener("open", () => {
        // hello
        const hello = {
          kind: "app",
          id: "feda@web",
          attrs: { name: "Feda" },
          meta: { platform: "web", env: "prod" },
          auth: "utopy-resonancia",
        };
        try { ws.send(JSON.stringify(hello)); } catch {}
      });

      ws.addEventListener("message", (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const items = extractDVs(msg);
          const only = items.filter((dv) => isDVForWorld(dv, worldId));
          if (only.length) mergeIncoming(only);
        } catch {}
      });

      ws.addEventListener("close", () => {
        // no loop agresivo acá; la página no necesita reconectar infinito
      });

      ws.addEventListener("error", () => {});
    } catch {}

    // listo cuando al menos intentamos ambos
    const t = setTimeout(() => {
      if (alive) setLoading(false);
    }, 600);

    return () => {
      alive = false;
      clearTimeout(t);
      try { ws && ws.close(); } catch {}
    };
  }, [worldId]);

  // centro mapa: si hay algo, centrar a lo primero
  const center = useMemo(() => {
    const firstNFT = nfts?.[0];
    if (firstNFT?.lat && firstNFT?.lng) return [firstNFT.lat, firstNFT.lng];
    const firstDV = dvs?.[0]?.attrs?.location;
    if (firstDV?.lat && firstDV?.lng) return [firstDV.lat, firstDV.lng];
    return [0, 0];
  }, [nfts, dvs]);

  return (
    <Container>
      <Header />
      <BackButton onClick={goBack}>
        <RiArrowLeftLine size={24} />
        <span>Volver</span>
      </BackButton>

      <MapSection>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* NFTs */}
            {nfts.map((nft) => (
              <Marker
                key={`nft:${nft.id}`}
                position={[nft.lat, nft.lng]}
                icon={L.icon({ iconUrl: nft.icon, iconSize: [40, 40] })}
                eventHandlers={{
                  click: () => {
                    if (nft.script) window.open(nft.script, "_blank");
                  },
                }}
              >
                <Popup>
                  <div>
                    <img src={nft.icon} alt={`NFT ${nft.id}`} width="80" />
                    <div><strong>NFT</strong></div>
                    <div>ID: {nft.id}</div>
                    <div>Lat: {nft.lat}</div>
                    <div>Lng: {nft.lng}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* ✅ DatoVivo */}
            {dvs.map((dv) => {
              const loc = dv?.attrs?.location;
              if (!loc?.lat || !loc?.lng) return null;

              const iconUrl = dv?.attrs?.media?.image || "/img/MundoCreador.png";
              const title =
                dv?.labels?.[0] ||
                dv?.attrs?.name ||
                dv?.attrs?.nombre ||
                dv?.kind ||
                "DatoVivo";

              return (
                <Marker
                  key={`dv:${dv?.id || title}`}
                  position={[loc.lat, loc.lng]}
                  icon={L.icon({ iconUrl, iconSize: [34, 34] })}
                >
                  <Popup>
                    <div style={{ maxWidth: 240 }}>
                      <div><strong>DatoVivo</strong></div>
                      <div style={{ marginTop: 6 }}><strong>{title}</strong></div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{dv?.kind}</div>
                      {iconUrl && (
                        <div style={{ marginTop: 8 }}>
                          <img src={iconUrl} alt={title} width="120" />
                        </div>
                      )}
                      {dv?.attrs?.description ? (
                        <div style={{ marginTop: 8 }}>{dv.attrs.description}</div>
                      ) : null}
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        {dv?.traits?.length ? `traits: ${dv.traits.join(", ")}` : ""}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </MapSection>

      <Sidebar>
        <BackButton onClick={goBack}>
          <RiArrowLeftLine size={20} />
        </BackButton>
        <Footer />
      </Sidebar>
    </Container>
  );
};

export default WorldNFTs;

/* ---------- estilos ---------- */

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`;

const MapSection = styled.div`
  position: absolute;
  top: 60px;
  left: 0;
  right: 220px;
  bottom: 0;
`;

const Sidebar = styled.div`
  position: absolute;
  top: 60px;
  right: 0;
  width: 220px;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
`;

const BackButton = styled.button`
  position: absolute;
  top: 70px;
  left: 12px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 10px 12px;
  border-radius: 999px;
  cursor: pointer;
`;
