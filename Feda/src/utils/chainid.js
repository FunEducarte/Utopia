// utils/chainid.js
const networkMap = {
  80002: "amoy",
  43113: "fuji",
  11155111: "sepolia",
  97: "tBNB",
  137: "polygon",
};

export const chainIdToNetworkName = (chainId) => {
  return networkMap[chainId] || "unknown";
};
