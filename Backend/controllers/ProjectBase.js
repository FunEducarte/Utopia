const supabase = require('../config/supabaseclient');

// Obtener proyectos asociados a un usuario
async function getProjectDetails(req, res) {
  try {
    const { userId, world } = req.query; // Cambia a userId para que coincida con la query del frontend

    if (!userId) {
      return res.status(400).json({ error: 'El user_id es requerido' });
    }

    // Obtener los project_id desde user_projects
    const { data: userProjects, error: userError } = await supabase
      .from('user_projects')
      .select('project_id')
      .eq('user_id', userId); // Usamos userId

    if (userError) throw userError;

    if (!userProjects || userProjects.length === 0) {
      return res.status(404).json({ message: 'No se encontraron proyectos para este usuario' });
    }

    const projectIds = userProjects.map((item) => item.project_id);

    // Obtener los detalles de los proyectos desde projects
    const { data: projectDetails, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .eq('world', world); // Filtrar por mundo

    if (projectError) throw projectError;

    res.status(200).json(projectDetails);
  } catch (error) {
    console.error('Error al obtener detalles de los proyectos:', error);
    res.status(500).json({ error: 'Error al obtener los detalles de los proyectos' });
  }
}
// backend/controllers/projectController.js
const leaveProject = async (req, res) => {
  const { userId, projectId } = req.body;

  try {
    const { data, error } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);

    if (error) {
      return res.status(500).json({ error: 'Error al desunirse del proyecto.' });
    }

    res.status(200).json({ message: 'Te has desunido del proyecto exitosamente.', data });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al procesar la solicitud.' });
  }
};


  
// Actualizar un proyecto
const updateProject = async (req, res) => {
  const { id } = req.params;
  const { projectTitle, description, mainLink, icon} = req.body; // Solo actualizamos estos campos

  try {
    // Actualizar los campos en Supabase
    const { data, error } = await supabase
      .from('projects')
      .update({ projectTitle, description, mainLink, icon })
      .eq('id', id)
      .select('projectTitle, description, mainLink, icon');

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    // Enviar respuesta con los datos actualizados
    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      project: data[0],
    });
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el proyecto',
      error: error.message,
    });
  }
};

const isUserJoined = async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.query; // Obtenemos el userId desde los parámetros de consulta

  if (!userId || !projectId) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros necesarios.' });
  }

  try {
    // Consulta para verificar si existe una relación entre el usuario y el proyecto
    const { data, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignorar el error si no encuentra resultados
      console.error('Error al verificar la unión:', error);
      return res.status(500).json({ success: false, message: 'Error al verificar la unión al proyecto.' });
    }

    // Si se encuentra una relación, el usuario está unido al proyecto
    const isJoined = !!data;
    res.status(200).json({ success: true, isJoined });
  } catch (err) {
    console.error('Error del servidor:', err);
    res.status(500).json({ success: false, message: 'Error del servidor al verificar la unión.' });
  }
};

/// Función para unirse a un proyecto
const joinProject = async (req, res) => {
  const { userId, projectId } = req.body;

  // Validación de entrada
  if (!userId || !projectId) {
    return res.status(400).json({ message: 'Se requieren userId y projectId' });
  }

  try {
    // Verificar si el usuario ya está unido al proyecto
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_projects')
      .select('*') 
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    if (existingRecord) {
      return res.status(400).json({ message: 'El usuario ya está unido a este proyecto' });
    }

    if (checkError && checkError.code !== 'PGRST116') { // Si el error es distinto a no encontrar registros
      throw checkError;
    }

    // Unir al usuario al proyecto
    const { data, error } = await supabase
      .from('user_projects')
      .insert([{ user_id: userId, project_id: projectId }]);

    if (error) {
      throw error;
    }

    res.status(200).json({ 
      message: 'Te has unido al proyecto exitosamente',
      userId: userId,
      projectId: projectId,
      data
    });
  } catch (error) {
    console.error('Error unirse al proyecto:', error);
    res.status(500).json({ message: 'Error al unirse al proyecto', error: error.message });
  }
};

// Exportar los controladores
module.exports = {
  leaveProject,
  updateProject,
  isUserJoined,
  joinProject,
  getProjectDetails
};
