// src/components/Search.jsx
import React, { useEffect, useState } from 'react';
import { searchCommunities } from '../../../services/communityService';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const results = await searchCommunities(searchQuery);
        setSearchResults(results);
      } catch (err) {
        setError(err.message);
      }
    };

    if (searchQuery) fetchResults();
    else setSearchResults([]); // Limpiar resultados si no hay query
  }, [searchQuery]);

  return (
    <div>
      <h2>Búsqueda</h2>
      <input
        type="text"
        placeholder="Buscar comunidades..."
        style={{ width: '80%', padding: '8px', borderRadius: '5px' }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {searchResults.length > 0 ? (
        <ul>
          {searchResults.map((community) => (
            <li key={community._id}>
              <h3>{community.name}</h3>
              <a href={community.url} target="_blank" rel="noopener noreferrer">
                  Ir a la comunidad
                </a>
            </li>
          ))}
        </ul>
      ) : searchQuery ? (
        <p>No se encontraron resultados.</p>
      ) : null}
    </div>
  );
};

export default Search;
