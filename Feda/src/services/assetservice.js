// src/services/assetservice.js
import { ethers } from 'ethers';
const baseUrl = 'http://localhost:3000'; // Cambia esta URL según tu configuración de backend

export const getContractDetails = async (networkName) => {
  try {
    const response = await fetch(`${baseUrl}/api/Project/contractDetails?networkName=${networkName}`);
    if (!response.ok) {
      throw new Error(`Error al obtener detalles del contrato para la red ${networkName}: ${response.statusText}`);
    }

    const { contractAddress, contractABI } = await response.json();
    console.log('Detalles del contrato:', { contractAddress, contractABI });
    return { contractAddress, contractABI };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createProjectOnChain = async (projectData, signer) => {
  try {
    // Asegurarse de que se pasa un signer válido
    if (!signer || typeof signer.getAddress !== 'function') {
      throw new Error('El signer no está definido o no es válido');
    }

    // Obtener la dirección del propietario
    const ownerAddress = await signer.getAddress();

    // Obtener dirección del contrato y ABI desde el backend según la plataforma
    const { contractAddress, contractABI } = await getContractDetails(projectData.platform);
    if (!contractAddress || !contractABI) {
      throw new Error(`No se pudieron obtener detalles del contrato para la plataforma: ${projectData.platform}`);
    }

    // Crear una instancia del contrato
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log('Creando proyecto en la blockchain...');
    
    // Enviar la transacción para crear el proyecto en la blockchain
    const tx = await contract.createProject(
      projectData.projectTitle, 
      projectData.description, 
      { from: ownerAddress } // Dirección del propietario
    );

    console.log('Esperando confirmación de la transacción...');
    
    // Esperar que la transacción sea minada
    await tx.wait();

    console.log('Transacción completada:', tx.hash);

    // Enviar los datos al backend junto con el hash de la transacción y el owner
    const response = await fetch(`${baseUrl}/api/Project/Create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectData: {
          projectTitle: projectData.projectTitle,
          description: projectData.description,
          icon: projectData.icon,
          mainLink: projectData.mainLink,
          world: projectData.world,
          platform: projectData.platform,
          owner: ownerAddress // Incluir el propietario
        },
        signedTransaction: tx.hash  // Hash de la transacción
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Datos del proyecto guardados en Supabase');
    } else {
      console.error('Error al guardar los datos en Supabase:', result.message);
    }

    // Retornar éxito con el hash de la transacción
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error('Error al crear el proyecto en la blockchain o guardar en el backend:', error);
    throw error;
  }
};



export const getProjects = async (platform, world) => {
  try {
    const response = await fetch(`${baseUrl}/api/Project/Projects?platform=${platform}&world=${world}`);
    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        projects: data.projects,
        message: `Proyectos de ${world} obtenidos exitosamente`
      };
    } else {
      return {
        success: false,
        message: data.message || 'Error al obtener proyectos',
      };
    }
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return {
      success: false,
      message: 'Error al obtener proyectos',
    };
  }
};
export const JoinProject = async (userId, projectId) => {
  try {
    const response = await fetch(`${baseUrl}/api/ProjectRoutes/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        projectId: projectId,  // Ya tienes el projectId
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Te has unido al proyecto:', data);
      return { success: true, data };
    } else {
      console.error('Error al unirse:', data.message);
      return { success: false, message: data.message };
    }
  } catch (error) {
    console.error('Error al unirse al proyecto:', error);
    return { success: false, message: error.message };
  }
};


export const fetchUserProjectsByWorld = async (userId, world) => {
  try {
    const response = await fetch(`${baseUrl}/api/projectRoutes/user?userId=${userId}&world=${world}`);

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    throw error;
  }
};

export const leaveProject = async (userId, projectId) => {
  try {
    const response = await fetch(`${baseUrl}/api/projectRoutes/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, projectId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Error al salir del proyecto.');
    }

    return result;
  } catch (error) {
    console.error('Error al salir del proyecto:', error);
    throw error;
  }
};


export const updateProject = async (projectID, updatedData) => {
  try {
    const response = await fetch(`${baseUrl}/api/ProjectRoutes/push/${projectID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el proyecto');
    }

    const updatedProject = await response.json();
    return updatedProject;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const isUserJoined = async (userId, projectId) => {
  try {
    const response = await fetch(`${baseUrl}/api/ProjectRoutes/${projectId}/is-joined?userId=${userId}`);
    const data = await response.json();
    return { joined: data.isJoined };
  } catch (error) {
    console.error('Error al verificar si el usuario está unido:', error);
    return { joined: false };
  }
};

