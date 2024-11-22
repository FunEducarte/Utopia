const { ethers, JsonRpcProvider } = require("ethers");
const path = require('path');

// Proveedores para cada red
const providers = {
  amoy: new JsonRpcProvider("https://polygon-amoy.infura.io/v3/65f2f9e803db4d04adecdc426d066000"),
  bsc: new JsonRpcProvider("https://bsc-mainnet.infura.io/v3/65f2f9e803db4d04adecdc426d066000"),
  ethereum: new JsonRpcProvider("https://mainnet.infura.io/v3/65f2f9e803db4d04adecdc426d066000"),
  fuji: new JsonRpcProvider('https://avalanche-fuji.infura.io/v3/65f2f9e803db4d04adecdc426d066000'),
  polygon: new JsonRpcProvider('https://polygon-mainnet.infura.io/v3/65f2f9e803db4d04adecdc426d066000')
};

// Función para cargar ABI con manejo de errores
const loadABI = (filePath) => {
  try {
    return require(filePath).abi;
  } catch (error) {
    console.error(`Error al cargar ABI desde ${filePath}:`, error);
    throw error;
  }
};

// Instancias de los contratos para cada red
const networks = {
  bsc: {
    name: 'bsc',
    projectManagement: {
      address:"0x8c45c98C0Ebe7C39CCBbe11A020EC86490b74977",
      abi: loadABI(path.join(__dirname, 'deployments/Bsc/ProjectManagement.json'))
    },
  },
  ethereum: {
    name: 'ethereum',
    projectManagement: {
      address:"0xc4cA1D09259bB902b1c0b6c0Ff3C9dcf799d9A5b",
      abi: loadABI(path.join(__dirname, 'deployments/Ethereum/ProjectManagement.json'))
    },
  },
  polygon: {
    name: 'polygon',
    projectManagement: {
      address:"0x6EB1B5C0BCd13ce7F26baE583ab05C16466ea037",
      abi: loadABI(path.join(__dirname, 'deployments/Polygon/ProjectManagement.json'))
    },
  },
  amoy:{
    name: 'polygonAmoy',
    projectManagement: {
      address:"0xc4cA1D09259bB902b1c0b6c0Ff3C9dcf799d9A5b",
      abi: loadABI(path.join(__dirname, 'deployments/amoy/ProjectManagement.json'))
    },

  }

  // Agrega el resto de las redes según sea necesario
};

// Función para normalizar el nombre de la red
const normalizeNetworkName = (networkName) => {
  return networkName === "bnb smart chain" ? "bsc" : networkName;
};

const getProjects = async (networkName) => {
  const normalizedNetworkName = normalizeNetworkName(networkName);
  const contract = getContract(normalizedNetworkName);
  
  try {
    const projects = await contract.getProjects();
    projects.forEach((project, index) => {
      console.log(`Project ${index}:`, project);  // Aquí revisas los datos completos del proyecto
    });
    return projects;
  } catch (error) {
    console.error(`Error al obtener proyectos en la red ${normalizedNetworkName}:`, error);
    throw error;
  }
};

// Función para obtener el contrato para la red especificada
const getContract = (networkName) => {
  const normalizedNetworkName = normalizeNetworkName(networkName);
  const network = networks[normalizedNetworkName];
  if (!network) throw new Error(`Red ${normalizedNetworkName} no configurada`);

  const provider = providers[normalizedNetworkName];
  const contract = new ethers.Contract(network.projectManagement.address, network.projectManagement.abi, provider);

  return contract;
};


module.exports = {
  getContract,
  getProjects,
};
