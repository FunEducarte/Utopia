// src/pages/JoinAsset.jsx
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import ProjectPage from "../components/ProjectModal";
import Header from "../components/header/header";
import { RiArrowLeftLine } from "@remixicon/react";
import "leaflet/dist/leaflet.css";
import { getAllWorlds } from "../services/metaverse";
import Footer from "../components/Footer";

import { worldsLiveSubscribe } from "../utopy/worlds.live";
import { adaptDatoToWorld } from "../utopy/datotoworld";

const JoinAsset = () => {
  const { chain, isConnected } = useAccount();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mezcla lista vieja + nueva por id
  const mergeAssets = (prev, incoming) => {
    const map = new Map();

    prev.forEach((a) => {
      if (!a) return;
      const key = a.id || a.title;
      if (key) map.set(key, a);
    });

    incoming.forEach((a) => {
      if (!a) return;
      const key = a.id || a.title;
      if (key) map.set(key, a); // lo nuevo pisa a lo viejo
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    let unsubscribe = null;

    const fetchAssets = async () => {
      setLoading(true);
      try {
        const response = await getAllWorlds();
        console.log("[JoinAsset] mundos (HTTP):", response);

        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && response.success) {
          list = response.projects || response.data || [];
        } else if (response && response.data) {
          list = response.data;
        } else {
          throw new Error(
            (response && response.message) ||
              "Error al obtener los proyectos."
          );
        }

        const normalized = list
          .map((raw) => adaptDatoToWorld(raw))
          .filter(Boolean);

        setAssets(normalized);
        setError(null);
      } catch (err) {
        console.error("Error al obtener los mundos:", err);
        setError(err.message || "Error desconocido");
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    // 1) snapshot inicial (HTTP / blockchain)
    fetchAssets();

    // 2) mundos / territorios vivos vía semilla
    console.log("[JoinAsset] suscribiendo worldsLiveSubscribe...");
    unsubscribe = worldsLiveSubscribe((allDatosVivos) => {
      console.log("[JoinAsset] mundos vivos recibidos:", allDatosVivos);
      const liveAssets = allDatosVivos
        .map((d) => adaptDatoToWorld(d))
        .filter(Boolean);
      setAssets((prev) => mergeAssets(prev, liveAssets));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const openModal = (asset) => {
    setSelectedProject(asset.raw || asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const truncate = (text, max) =>
    text && text.length > max ? text.slice(0, max) + "..." : text;

  const goBack = () => {
    navigate(window.history.length > 2 ? -1 : "/");
  };

  return (
    <>
      <Header />
      <BackButton onClick={goBack}>
        <RiArrowLeftLine size={30} />
      </BackButton>
      <PageWrapper>
        {loading && <p>Cargando espacios vivos...</p>}
        {error && <p>Error: {error}</p>}

        {!loading && !error && (
          <>
            {assets.length > 0 ? (
              <Carousel>
                {assets.map((asset) => (
                  <Card key={asset.id} onClick={() => openModal(asset)}>
                    <IconContainer>
                      {asset.icon ? (
                        <img
                          src={asset.icon}
                          alt={"Icono de " + (asset.title || "mundo")}
                        />
                      ) : (
                        <InitialBubble>
                          {(asset.title && asset.title[0]) || "∴"}
                        </InitialBubble>
                      )}
                    </IconContainer>

                    <Title>{truncate(asset.title, 22)}</Title>
                    <Description>
                      {truncate(asset.description, 40)}
                    </Description>

                    {asset.kind && (
                      <KindBadge>{String(asset.kind).toUpperCase()}</KindBadge>
                    )}
                  </Card>
                ))}
              </Carousel>
            ) : (
              <p>No se encontraron activos.</p>
            )}
          </>
        )}

        {isModalOpen && selectedProject && (
          <ProjectPage
            project={selectedProject}
            onClose={closeModal}
            chain={chain}
            isConnected={isConnected}
          />
        )}
      </PageWrapper>
      <Footer />
    </>
  );
};

export default JoinAsset;

/* ===================== estilos ===================== */

const PageWrapper = styled.div`
  padding: 40px 60px;
  text-align: center;
  width: 100vw;
  box-sizing: border-box;
`;

const Carousel = styled.div`
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 16px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 999px;
  }
`;

const Card = styled.div`
  flex: 0 0 220px;
  background: #050505;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 220px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 86px;
  height: 86px;
  background-color: #111;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 14px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InitialBubble = styled.span`
  font-size: 32px;
  color: #fff;
`;

const Title = styled.p`
  margin: 4px 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
`;

const Description = styled.p`
  margin: 4px 0 10px 0;
  color: #e5e5e5;
  font-size: 13px;
`;

const KindBadge = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #1f2933;
  color: #a7f3d0;
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
