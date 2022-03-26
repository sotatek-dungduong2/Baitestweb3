import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core';
import { Web3Provider } from "@ethersproject/providers";

function getLibrary(provider: any, connector: any) {
  // depend on web3 or ethers
  const library = new Web3Provider(provider);
  return library;
}
const Web3ProviderNetwork = createWeb3ReactRoot("NETWORK");

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <App></App>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
