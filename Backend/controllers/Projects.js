const {getContract, getProjects: getOnChainProjects } = require('../services/Blockchain.js');
const supabase = require('../config/supabaseclient');  // Cliente Supabase

// Obtener detalles del contrato basado en la plataforma o networkName
const getContractDetails = async (req, res) => {
  const networkName = req.query.platform || req.query.networkName; // Acepta ambos
  try {
    // Asegurarse de que la red esté soportada
    const contract = getContract(networkName);
    const contractAddress = contract.target;
    console.log('Detalles del contrato:', contract);


    // Verifica si ethers.FormatTypes es accesible
    const contractABI = JSON.stringify(contract.interface.fragments); // Transforma los fragmentos del ABI a JSON manualmente

    res.json({
      success: true,
      contractAddress,
      contractABI,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: `Error al obtener el contrato para la red ${networkName}: ${error.message}`,
    });
  }
};

// Controlador para manejar la creación del proyecto en Supabase
const createProject = async (req, res) => {
  console.log(req.body);
  const { projectData, signedTransaction } = req.body;

  try {
    // Validar que todos los datos requeridos están presentes
    if (!projectData || !signedTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Datos insuficientes para crear el proyecto',
      });
    }

    // Guardar los datos del proyecto en Supabase
    const { data, error } = await supabase
      .from('projects')  // Asume que tienes una tabla 'projects' en Supabase
      .insert({
        projectTitle: projectData.projectTitle,
        description:projectData.description,
        icon: projectData.icon,
        mainLink: projectData.mainLink,
        world: projectData.world,
        owner: projectData.owner,                  // Propietario
        platform: projectData.platform,
        transactionHash: signedTransaction,  // Guardar el hash de la transacción
        created_at: new Date(),
      });

    if (error) {
      console.error('Error al insertar datos en Supabase:', error);
      return res.status(500).json({ success: false, message: 'Error al guardar el proyecto en Supabase' });
    }

    res.status(200).json({ success: true, message: 'Proyecto creado con éxito', data });

  } catch (error) {
    console.error('Error al crear el proyecto:', error);
    res.status(500).json({ success: false, message: 'Error al crear el proyecto' });
  }
};
const getAllProjects = async (req, res) => {
  const { platform, world } = req.query;

  try {
    console.log('Platform:', platform);
    console.log('World:', world);

    // Obtener proyectos guardados en Supabase
    const { data: savedProjects, error: fetchError } = await supabase
    .from('projects')
    .select('*')  // Obtén todos los proyectos sin filtros
    .eq('world', world)
    .eq('world', world)
  
  if (fetchError) {
    console.error('Supabase fetch error:', fetchError);
  } else {
    console.log(savedProjects); // Revisa los proyectos en consola
  }

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      throw new Error('Error al obtener proyectos guardados');
    }

    if (!savedProjects || savedProjects.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Sin proyectos actualmente.',
        projects: [], // Retorna una lista vacía
      });
    }

    // Formatear los proyectos obtenidos para enviarlos al frontend
    const formattedProjects = savedProjects.map(project => ({
      id: project.id,                        // ID de Supabase
      projectTitle: project.projectTitle,    // Nombre del proyecto
      description: project.description,      // Descripción del proyecto
      platform: project.platform,            // Plataforma
      mainLink: project.mainLink,            // Enlace principal
      owner: project.owner,                  // Propietario
      createdAt: project.created_at,         // Fecha de creación (de Supabase)
      icon_url: project.icon,                // URL del icono
      world: project.world                   // Mundo al que pertenece el proyecto
    }));

    // Responder con los proyectos formateados obtenidos de Supabase
    res.json({
      success: true,
      message: `Proyectos de ${world} obtenidos exitosamente.`,
      projects: formattedProjects,
    });

  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    res.status(500).json({
      success: false,
      message: `Error al obtener los proyectos de ${world}: ${error.message}`,
    });
  }
};


module.exports = {
  createProject,
  getAllProjects,
  getContractDetails
};
