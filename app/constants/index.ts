import { abi } from "./abi";
import { arbitrumSepolia, baseSepolia } from "./address";

export const config = {
  "base-sepolia": {
    address: baseSepolia,
    abi,
  },
  "arbitrum-sepolia": {
    address: arbitrumSepolia,
    abi,
  },
};
