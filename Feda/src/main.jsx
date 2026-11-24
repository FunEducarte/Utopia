import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css';
import {getDefaultConfig,RainbowKitProvider,} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet,polygon, bsc, polygonAmoy, avalancheFuji, sepolia,bscTestnet} from 'wagmi/chains';
import {QueryClientProvider,  QueryClient,} from "@tanstack/react-query";
import ErrorBoundary from './services/error.jsx';
const config = getDefaultConfig({
    appName: 'Feda',
    projectId:'7f26933f3f6eb4a8b22eb7e8e6e6bc3a',
    chains: [mainnet, polygon, bsc, polygonAmoy, avalancheFuji,sepolia,bscTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

const queryClient = new QueryClient();
  


createRoot(document.getElementById('root')).render(
  <StrictMode>
   <ErrorBoundary>
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
                <App/>
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
   </ErrorBoundary>
  </StrictMode>,
);