// services/communityService.js

const BASE_URL = 'http://localhost:3000'; // Ajusta esta URL a la de tu backend

// Obtener todas las comunidades para un usuario específico
export const fetchCommunities = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/communities/getAll`);
    if (!response.ok) throw new Error('Error al obtener las comunidades');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en fetchCommunities:', error);
    throw error;
  }
};

// Crear una nueva comunidad
export const createCommunity = async (communityData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/communities/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communityData),
    });

    if (!response.ok) throw new Error('Error al crear la comunidad');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en createCommunity:', error);
    throw error;
  }
};

export const searchCommunities = async (query) => {
  if (!query) return [];

  try {
    const response = await fetch(`${BASE_URL}/api/communities/communities/search?query=${query}`);
    
    // Verificar si la respuesta es válida
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.communities;
  } catch (err) {
    console.error('Error en la búsqueda de comunidades:', err);
    throw err; // Propagar el error para ser manejado en el componente
  }
};

