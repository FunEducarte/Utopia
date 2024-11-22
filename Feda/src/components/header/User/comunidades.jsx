import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RiAddCircleLine } from '@remixicon/react';
import { fetchCommunities, createCommunity } from '../../../services/communityService';

// Styled-components
const AddIcon = styled(RiAddCircleLine)`
  cursor: pointer;
  transition: transform 0.3s ease, color 0.3s ease;
  &:hover {
    transform: scale(1.2);
    color: #007bff;
  }
`;

const CommunitiesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SlideForm = styled.form`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: max-height 0.5s ease-in-out;
  max-height: ${(props) => (props.show ? '300px' : '0')};
  overflow: hidden;
`;

const CarouselWrapper = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
`;

const CarouselContent = styled.div`
  display: flex;
  transition: transform 0.3s ease;
  transform: translateX(${(props) => props.translate}px);
`;

const CommunityCard = styled.div`
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-width: 300px; /* Ajustar al tamaño deseado */
  margin-right: 10px;
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
`;

const Arrow = styled.div`
  cursor: pointer;
  user-select: none;
  font-size: 2rem;
  padding: 10px;
`;

const Communities = () => {
  const [communities, setCommunities] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', url: '' });
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cargar comunidades al montar el componente
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setLoading(true);
        const data = await fetchCommunities();
        setCommunities(data);
      } catch (err) {
        setError(`Error al cargar comunidades: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadCommunities();
  }, []);

  const handleCreateCommunity = async (e) => {
    e.preventDefault();

    if (!newCommunity.name || !newCommunity.url) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      const community = await createCommunity(newCommunity);
      setCommunities((prev) => [...prev, community]);
      setNewCommunity({ name: '', url: '' });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(`Error al crear comunidad: ${err.message}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < communities.length - 3) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div>
      <CommunitiesHeader>
        <h2>Comunidades</h2>
        <AddIcon size={30} onClick={() => setShowForm((prev) => !prev)} />
      </CommunitiesHeader>

      {showForm && (
        <SlideForm onSubmit={handleCreateCommunity} show={showForm}>
          <input
            type="text"
            placeholder="Nombre de la comunidad"
            value={newCommunity.name}
            onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="URL de la comunidad"
            value={newCommunity.url}
            onChange={(e) => setNewCommunity({ ...newCommunity, url: e.target.value })}
            required
          />
          <button type="submit" disabled={!newCommunity.name || !newCommunity.url}>
            Crear comunidad
          </button>
        </SlideForm>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <div>Cargando comunidades...</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Arrow onClick={handlePrev}>&lt;</Arrow>
          <CarouselWrapper>
            <CarouselContent translate={-currentIndex * 310}>
              {communities.length > 0 ? (
                communities.map((community, index) => (
                  <CommunityCard key={community.id}>
                    <h3>{community.name}</h3>
                    <a href={community.url} target="_blank" rel="noopener noreferrer">
                      Ir a la comunidad
                    </a>
                  </CommunityCard>
                ))
              ) : (
                <div>No hay comunidades disponibles.</div>
              )}
            </CarouselContent>
          </CarouselWrapper>
          <Arrow onClick={handleNext}>&gt;</Arrow>
        </div>
      )}
    </div>
  );
};

export default Communities;
