import { ethers } from "ethers";
import { getContractWithSigner, networks, providers } from "./blockchain";
import StakingABI from "../abis/Staking.json";

export const createWorld = async (networkName, signer, worldData) => {
  try {
    const contract = getContractWithSigner(networkName, signer);

    const decimals = parseInt(worldData.decimals);
    const totalSupply = ethers.parseUnits(
      worldData.totalSupply.toString(),
      decimals
    );

    const tx = await contract.createWorld(
      worldData.name,
      worldData.description,
      worldData.icon,
      worldData.tokenSymbol,
      worldData.tokenDNA, // DNA como string JSON
      decimals,            // uint8
      totalSupply          // uint256
    );

    await tx.wait();
    console.log(`🌍 Mundo creado: ${worldData.name}`);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error al crear el mundo:", error);
    return null;
  }
};



export const getAllWorlds = async () => {
  const allWorlds = [];

  for (const networkName of Object.keys(providers)) {
    const provider = providers[networkName];
    const config = networks[networkName];

    try {
      const contract = new ethers.Contract(
        config.projectManagement.address,
        config.projectManagement.abi,
        provider
      );

      const ids = await contract.getAllWorlds();

      for (const id of ids) {
        try {
          const world = await contract.getWorld(id);
          allWorlds.push({
            id,
            name: world.name,
            description: world.description,
            icon: world.icon,
            tokenName: world.tokenName,
            tokenSymbol: world.tokenSymbol,
            creator: world.creator,
            tokenAddress: world.tokenAddress,
            stakingAddress: world.stakingAddress,
            Dna: world.dna,
            createdAt: Number(world.createdAt),
            chain: networkName,
          });
        } catch (err) {
          console.warn(`❌ Falló getWorld(${id}) en ${networkName}:`, err);
        }
      }
    } catch (err) {
      console.error(`❌ Error al procesar red ${networkName}:`, err);
    }
  }

  return allWorlds;
};

// ✏️ Actualizar información de un mundo
export const updateWorld = async (networkName, signer, worldId, updatedData) => {
  try {
    const contract = getContractWithSigner(networkName, signer);

    const tx = await contract.updateWorld(
      worldId,
      updatedData.name,
      updatedData.description,
      updatedData.icon
    );

    await tx.wait();
    console.log(`🔄 Mundo actualizado: ${updatedData.name}`);
    return tx.hash;
  } catch (error) {
    console.error("❌ Error al actualizar el mundo:", error);
    return null;
  }
};

const AddressZero = "0x0000000000000000000000000000000000000000";

export const getStakedWorlds = async (networkName, signer, userAddress) => {
  try {
    const contract = getContractWithSigner(networkName, signer);
    const worldIds = await contract.getAllWorlds();
    const stakedWorlds = [];

    for (const worldId of worldIds) {
      try {
        const stakingAddress = await contract.getWorldStaking(worldId);
        if (stakingAddress !== AddressZero) {
          const stakingContract = new ethers.Contract(stakingAddress, StakingABI, signer);
          const rawStakedAmount = await stakingContract.getStakedAmount(userAddress);

          const stakedAmount = ethers.toBigInt(rawStakedAmount);

          if (stakedAmount > 0n) {
            const worldMetadata = await contract.getWorld(worldId);
            stakedWorlds.push({
              worldId,
              stakingAddress,
              stakedAmount: ethers.formatEther(stakedAmount),
              icon: worldMetadata.icon, 
              name: worldMetadata.name,
              description: worldMetadata.description,
              tokenAddress: worldMetadata.tokenAddress,
              stakingAddress: worldMetadata.stakingAddress,
              creator: worldMetadata.creator, 
              // <- esto es lo que necesitás
            });
          }
        }
      } catch (worldError) {
        console.error(`⚠️ Error verificando staking en ${worldId}:`, worldError);
      }
    }

    return stakedWorlds;
  } catch (error) {
    console.error("❌ Error al obtener mundos stakeados:", error);
    return [];
  }
};
// 🔄 Sincronizar solo mundos en los que el usuario tiene tokens en staking
export const syncMyWorlds = async (networkName, signer, userAddress, dstChainId) => {
  try {
    const contract = getContractWithSigner(networkName, signer);
    const stakedWorlds = await getStakedWorlds(networkName, signer, userAddress);
    
    for (const { worldId } of stakedWorlds) {
      try {
        await contract.syncWorld(dstChainId, worldId);
        console.log(`✅ Mundo ${worldId} sincronizado`);
      } catch (syncError) {
        console.error(`⚠️ Error al sincronizar mundo ${worldId}:`, syncError);
      }
    }

    return {
      success: true,
      count: stakedWorlds.length,
    };
  } catch (error) {
    console.error("❌ Error sincronizando mundos del usuario:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

