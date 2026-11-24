import { ethers, JsonRpcProvider } from "ethers";

// ABI imports
import BNBWorldABI from './deployments/tBNB/MetaverseW.json';
import BNBNftsABI from './deployments/tBNB/MetaverseNFT.json'
import BscABI from './deployments/Bsc/ProjectManagement.json';
import PolygonABI from './deployments/Polygon/TokenFactoryDSL.json';
import FujiABI from './deployments/Fuji/MetaverseW.json';
import FujiNFT from "./deployments/fuji/MetaverseNFT.json"
import SepoliaABI from "./deployments/Sepolia/MetaverseW.json";
import SepoliaNFT from "./deployments/Sepolia/MetaverseNFT.json"

// RPC providers por red
export const providers = {
  tBNB: new JsonRpcProvider("https://bsc-testnet.infura.io/v3/65f2f9e803db4d04adecdc426d066000"),
  fuji: new JsonRpcProvider("https://avalanche-fuji.infura.io/v3/65f2f9e803db4d04adecdc426d066000"),
  sepolia: new JsonRpcProvider("https://sepolia.infura.io/v3/65f2f9e803db4d04adecdc426d066000")
};

// Configuración de contratos por red
export const networks = {
  tBNB: {
    name: "tBNB",
    projectManagement: {
      address: "0xF3EB72CFfA8CAaD05C6e7110781230A1Bc24440E",
      abi: BNBWorldABI.abi,
    },
    nft:{
      address:"0x238c82f4D47b7C0B333216aA8f5E46BBFdd3dEBc",
      abi:BNBNftsABI.abi
    }
  },
  bsc: {
    name: "bsc",
    projectManagement: {
      address: "0xe9953395cA3449890e477a72A0FdfB58a401C4C3",
      abi: BscABI.abi,
    },
  },
  polygon: {
    name: "polygon",
    projectManagement: {
      address: "0xF745e54631C2f864B65045749640b9c366e88F9c",
      abi: PolygonABI.abi,
    },
  },
  fuji: {
    name: "fuji",
    projectManagement: {
      address: "0x74d90664D3c8eF202e3AC22B9d6a6c3e51878245",
      abi: FujiABI.abi,
    },
    nft:{
      address:"0xC435120d9f7ada4AC41078f6b83d012A0d6eC8A8",
      abi: FujiNFT.abi
    }
  },
  sepolia:{
    name:"sepolia",
    projectManagement:{
      address:"0x8ef01cF76E9289e6d4b43a897c41cfC3592EB779",
      abi: SepoliaABI.abi
    },
    nft:{
      address:"0xa2c9F0Fe6e0BaAd0A81b995Fda492f1C9f82181a",
      abi: SepoliaNFT.abi
    }
  }
};

// Obtiene contrato conectado a un signer para transacciones (ProjectManagement)
export const getContractWithSigner = (networkName, signer) => {
  const config = networks[networkName];
  console.log("🧪 networkName recibido:", networkName);
  console.log("🧪 networks[networkName]:", networks[networkName]);

  if (!config || !config.projectManagement)
    throw new Error(`Red ${networkName} no configurada`);

  return new ethers.Contract(
    config.projectManagement.address,
    config.projectManagement.abi,
    signer
  );
};

// Obtiene contrato de MetaverseNFT con signer
export const getMetaverseNFTContract = (networkName, signer) => {
  const config = networks[networkName];
  if (!config || !config.nft)
    throw new Error(`Contrato NFT no configurado en ${networkName}`);

  return new ethers.Contract(
    config.nft.address,
    config.nft.abi,
    signer
  );
};
