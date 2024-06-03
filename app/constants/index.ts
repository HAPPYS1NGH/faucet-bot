import { abi } from "./abi";
import { arbitrumSepolia, baseSepolia } from "./address";

export const contracts = {
  baseSepolia: {
    address: baseSepolia,
    abi,
  },
  arbitrumSepolia: {
    address: arbitrumSepolia,
    abi,
  },
};
