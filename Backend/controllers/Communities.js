const supabase = require('../config/supabaseclient');

const communitiesController = {
  // Obtener todas las comunidades
  getAllCommunities: async (req, res) => {
    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*');

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      res.json(communities);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Crear una nueva comunidad
createCommunity: async (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ message: 'El nombre y el link son obligatorios' });
  }

  try {
    // Insertar la nueva comunidad en la tabla `communities`
    const { data: newCommunity, error } = await supabase
      .from('communities')
      .insert([{ name, url }]) // Ajusta el nombre de la columna `url` si es necesario
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.status(201).json({ message: 'Comunidad creada exitosamente', community: newCommunity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
},

  // Buscar comunidades por nombre
  searchCommunities: async (req, res) => {
    const { query } = req.query;

    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*')
        .ilike('name', `%${query}%`);

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      res.json({ communities });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = communitiesController;
