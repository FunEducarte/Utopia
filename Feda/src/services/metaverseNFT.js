import { getMetaverseNFTContract, providers } from "./blockchain"; // 🔥 Usamos el contract loader unificado
// Mint completo en una transacción
import { ethers } from "ethers";

export const mintNFT = async (platform, signer, worldId, lat, lng, sceneUrl) => {
  const contract = getMetaverseNFTContract(platform, signer);

  const latitudeBytes32 = ethers.encodeBytes32String(lat.toString());
  const longitudeBytes32 = ethers.encodeBytes32String(lng.toString());

  // ✅ Crear un hash real de la URL de la escena (esto sí es 32 bytes correctos)
  const sceneHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(sceneUrl));

  const tx = await contract.mintNFT(
    signer,
    worldId,
    latitudeBytes32,
    longitudeBytes32,
    sceneHashBytes32
  );

  await tx.wait();

  // Luego puedes llamar a updateNFTMetadata(tokenId, sceneUrl, iconUrl) si lo deseas
  return tx.hash;
};

// Para futuras actualizaciones (iconos, cambios, etc.)
export const updateNFTMetadata = async (
  networkName,
  signer,
  tokenId,
  newSceneUrl,
  newIconUrl
) => {
  const nftContract = getMetaverseNFTContract(networkName, signer);

  const tx = await nftContract.updateNFTMetadata(tokenId, newSceneUrl, newIconUrl);
  await tx.wait();
  return tx.hash;
};

export const getAllNFTsByWorldId = async (worldId) => {
  const allNFTs = [];

  for (const networkName of Object.keys(providers)) {
    const provider = providers[networkName];
    try {
      const nftContract = getMetaverseNFTContract(networkName, provider);
      const tokenIds = await nftContract.getNFTsByWorld(worldId);

      if (!tokenIds.length) continue;

      const nftDataArray = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const data = await nftContract.getNFTData(tokenId);
          return {
            id: Number(tokenId),
            lat: parseFloat(ethers.decodeBytes32String(data.latitude)),
            lng: parseFloat(ethers.decodeBytes32String(data.longitude)),
            script: data.scene, // ya es un hash hexadecimal como string
            icon:
              data.iconUrl ||
              "https://res.cloudinary.com/de2vg1giw/image/upload/v1747140354/Sin_t%C3%ADtulo_33_c7z4gp.png",
            chain: networkName,
          };
        })
      );

      allNFTs.push(...nftDataArray);
    } catch (err) {
      console.warn(`❌ Error en ${networkName} al obtener NFTs por worldId ${worldId}:`, err.message);
    }
  }

  return allNFTs;
};
export const getOwnedNFTsByWorldId = async (worldId, userAddress) => {
  const ownedNFTs = [];

  for (const networkName of Object.keys(providers)) {
    const provider = providers[networkName];
    try {
      const nftContract = getMetaverseNFTContract(networkName, provider);
      const tokenIds = await nftContract.getNFTsByWorld(worldId);

      if (!tokenIds.length) continue;

      const filtered = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const owner = await nftContract.ownerOf(tokenId);
          if (owner.toLowerCase() !== userAddress.toLowerCase()) return null;

          const data = await nftContract.getNFTData(tokenId);
          return {
            id: Number(tokenId),
            lat: parseFloat(ethers.decodeBytes32String(data.latitude)),
            lng: parseFloat(ethers.decodeBytes32String(data.longitude)),
            script: data.scene,
            icon:
              data.iconUrl ||
              "https://res.cloudinary.com/de2vg1giw/image/upload/v1747140354/Sin_t%C3%ADtulo_33_c7z4gp.png",
            chain: networkName,
            sceneUrl: data.sceneUrl,
          };
        })
      );

      ownedNFTs.push(...filtered.filter(Boolean));
    } catch (err) {
      console.warn(`❌ Error en ${networkName} al filtrar NFTs por owner:`, err.message);
    }
  }

  return ownedNFTs;
};



// Función opcional para quemar NFT
export const burnMyNFT = async (networkName, signer, tokenId) => {
  try {
    if (!tokenId) throw new Error("Token ID inválido");

    const nftContract = getMetaverseNFTContract(networkName, signer);

    const tx = await nftContract.burnMyNFT(tokenId);
    await tx.wait();
    console.log(`🔥 NFT quemado: Tx Hash ${tx.hash}`);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error al quemar NFT:", error);
    throw error;
  }
};

// Función opcional para enviar NFT a otra chain
export const sendNFTToChain = async (
  networkName,
  signer,
  destinationChainId,
  tokenId,
  nativeFee
) => {
  try {
    if (!destinationChainId || !tokenId)
      throw new Error("Parámetros inválidos para enviar NFT");

    const nftContract = getMetaverseNFTContract(networkName, signer);

    const tx = await nftContract.sendNFTToChain(destinationChainId, tokenId, {
      value: nativeFee, // La fee para el mensaje de LayerZero
    });
    await tx.wait();
    console.log(
      `🚀 NFT enviado a la chain ${destinationChainId}: Tx Hash ${tx.hash}`
    );
    return tx.hash;
  } catch (error) {
    console.error("❌ Error al enviar NFT a otra chain:", error);
    throw error;
  }
};
