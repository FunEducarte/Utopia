import { ethers } from "ethers";
import StakingABI from "../abis/Staking.json";
import ERC20_ABI from "../abis/ERC20.json";
import { providers } from "./blockchain";

// 🔁 Retorna una instancia del contrato de staking dado su address
export const getStakingContract = (signer, stakingAddress) => {
  return new ethers.Contract(stakingAddress, StakingABI, signer);
};
export const getStakedAmount = async (stakingAddress, userAddress, chainName) => {
  const provider = providers[chainName];

  if (!provider) throw new Error(`❌ No hay provider configurado para la red: ${chainName}`);

  const stakingContract = new ethers.Contract(stakingAddress, StakingABI, provider);
  const amount = await stakingContract.getStakedAmount(userAddress);
  return amount;
};


// 📥 Realiza staking
export const stakeTokens = async (stakingAddress, amount, signer) => {
  const contract = new ethers.Contract(stakingAddress, StakingABI, signer)

  const tx = await contract.stake(ethers.parseEther(amount))
  await tx.wait()

  return tx
}
export const approveTokens = async (tokenAddress, stakingAddress, amount,signer) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  const tx = await tokenContract.approve(stakingAddress, ethers.parseEther(amount));
  await tx.wait();

  return tx;
};


// 💸 Unstake tokens
export const unstakeTokens = async (stakingAddress, amount) => {
  try {
    const contract = getStakingContract(stakingAddress);
    const tx = await contract.unstake(amount);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("❌ Error al hacer unstake:", error);
    return null;
  }
};
