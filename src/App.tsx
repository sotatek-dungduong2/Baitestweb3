import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import "./App.css";
import MetamaskLogo from "./assets/img/ic-metamask.svg";
import WalletConnect from "./assets/img/ic-walletconnect.svg";
import Web3 from "web3";
import WETH_ABI from "./utils/WETHABI.json";
import MASTERCHEF_ABI from "./utils/MasterchefABI.json";
import { useEffect, useState } from "react";
import {
  API_SUBGRAPH,
  CONNECTED_BY,
  DEPOSIT,
  DEPOSIT_ENTITY,
  MASTERCHEF_ADDRESS,
  MAX_APPROVE,
  METAMASK,
  NETWORK_URLS,
  STAKE,
  WALLETCONNECT_BRIDGE_URL,
  WALLET_CONNECT,
  WETH_ADDRESS,
  WITHDRAW,
} from "./utils/common.const";
import Popup from "./components/Popup";
import {
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import Spinner from "./components/Spinner";
import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import moment from "moment";

const injected = new InjectedConnector({
  supportedChainIds: [1, 4, 5],
});

const walletConnectConnector = new WalletConnectConnector({
  supportedChainIds: [1, 4, 5],
  rpc: NETWORK_URLS,
  bridge: WALLETCONNECT_BRIDGE_URL,
  qrcode: true,
});

function App() {
  const [balance, setBalance] = useState(0);
  const [tokenEarned, setTokenEarned] = useState(0);
  const [myStake, setMyStake] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [approved, setApprove] = useState(0);
  const [showPopup, setStatePopup] = useState(false);
  const [dataPopup, setDataPopup] = useState({});
  const [loadingScreen, setLoading] = useState(false);
  const [dataSubGraph, setDataSubGraph] = useState([]);
  const { account, activate, library } = useWeb3React();

  const DATA_SUBGRAPH = gql`
  query GetDeposit {
    depositEntities(where: {user: "${account}"}) {
      id
      user
      amount
      time
    }
    withdrawEntities(where: {user: "${account}"}) {
      id
      user
      amount
      time
    }
  }
`;

  useEffect(() => {
    checkConnect();
  }, [account]);

  const connectMetamask = () => {
    localStorage.setItem("connectedBy", METAMASK);
    activate(injected, (error) => {
      handleError(error);
    });
  };

  const connectWalletConnect = () => {
    localStorage.setItem("connectedBy", WALLET_CONNECT);
    activate(walletConnectConnector, (error) => {
      handleError(error);
    });
  };

  const handleError = (error: any) => {
    if (error) {
      alert(error.message);
    }
  };

  const renderContract = (contractAbi: any, address: string) => {
    const web3 = new Web3(library.provider);
    const contract = new web3.eth.Contract(contractAbi, address);
    return contract;
  };

  const convertNumber = (number: string) => {
    const web3 = new Web3(library.provider);
    return +web3.utils.fromWei(number);
  };

  const convertHexNumber = (number: any) => {
    const web3 = new Web3(library.provider);
    return +convertNumber(web3.utils.toBN(number).toString());
  };

  const getBalance = async () => {
    const contract = renderContract(WETH_ABI as any, WETH_ADDRESS);
    const balanceAccount = await contract.methods.balanceOf(account).call();
    setBalance(convertNumber(balanceAccount));
  };

  const getTokenEarned = async () => {
    const contract = renderContract(MASTERCHEF_ABI as any, MASTERCHEF_ADDRESS);
    const tokenEarned = await contract.methods.pendingDD2(account).call();
    setTokenEarned(convertNumber(tokenEarned));
  };

  const getMyStake = async () => {
    const contract = renderContract(MASTERCHEF_ABI as any, MASTERCHEF_ADDRESS);
    const myStake = await contract.methods.userInfo(account).call();
    setMyStake(convertNumber(myStake.amount));
  };

  const getTotalStake = async () => {
    const contract = renderContract(WETH_ABI as any, WETH_ADDRESS);
    const totalStake = await contract.methods
      .balanceOf(MASTERCHEF_ADDRESS)
      .call();
    setTotalStake(convertNumber(totalStake));
  };

  const approve = async () => {
    const contract = renderContract(WETH_ABI as any, WETH_ADDRESS);
    try {
      const approve = await contract.methods
        .approve(MASTERCHEF_ADDRESS, MAX_APPROVE)
        .send({
          from: account,
        });
      setApprove(approve);
    } catch (error) {
      handleError(error);
      setApprove(0);
    }
  };

  const checkApprove = async () => {
    const contract = renderContract(WETH_ABI as any, WETH_ADDRESS);
    const approve = await contract.methods
      .allowance(account, MASTERCHEF_ADDRESS)
      .call();
    setApprove(approve);
  };

  const convertMulticallData = (data: any) => {
    return data.callsReturnContext[0].returnValues[0].hex;
  };

  const getData = async () => {
    // Without multicall
    // await checkApprove();
    // await getBalance();
    // await getTokenEarned();
    // await getMyStake();
    // await getTotalStake();

    const web3 = new Web3(library.provider);
    const multicall = new Multicall({ web3Instance: web3, tryAggregate: true });
    const contractCallContext: ContractCallContext[] = [
      {
        reference: "allowance",
        contractAddress: WETH_ADDRESS,
        abi: WETH_ABI,
        calls: [
          {
            reference: "allowance",
            methodName: "allowance",
            methodParameters: [account, MASTERCHEF_ADDRESS],
          },
        ],
      },
      {
        reference: "balance",
        contractAddress: WETH_ADDRESS,
        abi: WETH_ABI,
        calls: [
          {
            reference: "balance",
            methodName: "balanceOf",
            methodParameters: [account],
          },
        ],
      },
      {
        reference: "tokenearned",
        contractAddress: MASTERCHEF_ADDRESS,
        abi: MASTERCHEF_ABI,
        calls: [
          {
            reference: "tokenearned",
            methodName: "pendingDD2",
            methodParameters: [account],
          },
        ],
      },
      {
        reference: "mystake",
        contractAddress: MASTERCHEF_ADDRESS,
        abi: MASTERCHEF_ABI,
        calls: [
          {
            reference: "mystake",
            methodName: "userInfo",
            methodParameters: [account],
          },
        ],
      },
      {
        reference: "totalstake",
        contractAddress: WETH_ADDRESS,
        abi: WETH_ABI,
        calls: [
          {
            reference: "mystake",
            methodName: "balanceOf",
            methodParameters: [MASTERCHEF_ADDRESS],
          },
        ],
      },
    ];
    try {
      const results: ContractCallResults = await multicall.call(
        contractCallContext
      );
      if (results && results.results) {
        setLoading(false);
        const { allowance, balance, tokenearned, mystake, totalstake } =
          results.results;
        setApprove(convertMulticallData(allowance));
        setBalance(convertHexNumber(convertMulticallData(balance)));
        setTokenEarned(convertHexNumber(convertMulticallData(tokenearned)));
        setMyStake(convertHexNumber(convertMulticallData(mystake)));
        setTotalStake(convertHexNumber(convertMulticallData(totalstake)));
      }
      await fetchDataFromSubGraph();
    } catch (error) {
      setLoading(false);
      handleError(error);
    }
  };

  const fetchDataFromSubGraph = async () => {
    const client = new ApolloClient({
      uri: API_SUBGRAPH,
      cache: new InMemoryCache(),
    });
    const data = await client.query({
      query: DATA_SUBGRAPH,
    });
    const { depositEntities, withdrawEntities } = data.data;
    const newArr: any = [...depositEntities, ...withdrawEntities].map((ele) => {
      const newObj = { ...ele };
      newObj.amount = convertNumber(newObj.amount);
      newObj.type = newObj.__typename === DEPOSIT_ENTITY ? DEPOSIT : WITHDRAW;
      newObj.time = moment.unix(ele.time).format("hh:mm, MM/DD/YYYY");
      return newObj;
    });

    setDataSubGraph(newArr);
  };

  const harvest = async () => {
    setLoading(true);
    const contract = renderContract(MASTERCHEF_ABI as any, MASTERCHEF_ADDRESS);
    try {
      await contract.methods.deposit(0).send({
        from: account,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      handleError(error);
    }
  };

  const handlePopup = (state: any, data: any) => {
    setStatePopup(state);
    setDataPopup(data);
  };

  const handleAfter = async (data: string) => {
    setStatePopup(false);
    await getData();
    setLoading(false);
  };

  const checkConnect = async () => {
    if (!account) {
      const connectedBy = localStorage.getItem(CONNECTED_BY);
      switch (connectedBy) {
        case METAMASK:
          const isAuthorized = await injected.isAuthorized();
          if (isAuthorized) {
            activate(injected, handleError);
          }
          break;
        case WALLET_CONNECT:
          activate(walletConnectConnector, handleError);
          break;
      }
      return;
    }
    setLoading(true);
    getData();
  };

  return (
    <div className="App">
      {account ? (
        <div>
          {loadingScreen ? (
            <Spinner></Spinner>
          ) : (
            <div className="wrapper">
              <div className="information-box">
                <p>Wallet Address: {account}</p>
                <p>Balance: {balance} WETH</p>
                <p>Token earned: {tokenEarned} DD2</p>
                <p>Your stake: {myStake} WETH</p>
                <p>Total stake: {totalStake} WETH</p>
                <button className="custom-button" onClick={harvest}>
                  Harvest
                </button>
                {approved ? (
                  <div className="btn-action">
                    <button
                      onClick={() =>
                        handlePopup(true, {
                          action: STAKE,
                          number: balance,
                        })
                      }
                    >
                      Stake
                    </button>
                    <button
                      onClick={() =>
                        handlePopup(true, {
                          action: WITHDRAW,
                          number: myStake,
                        })
                      }
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  <button className="custom-button" onClick={approve}>
                    Approve
                  </button>
                )}
                {showPopup ? (
                  <Popup
                    handleAfterCall={(name: string) => {
                      handleAfter(name);
                    }}
                    updateLoading={(state: boolean) => setLoading(state)}
                    closePopup={() => setStatePopup(false)}
                    {...dataPopup}
                  ></Popup>
                ) : (
                  ""
                )}
              </div>
              {dataSubGraph.length > 0 ? (
                <div className="subgraph-box">
                  <table>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataSubGraph.map((ele: any) => {
                        return (
                          <tr key={ele.id}>
                            <td>{ele.type}</td>
                            <td>{ele.amount}</td>
                            <td>{ele.time}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                ""
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="btn-wrapper">
          <h2>Please connect to wallet.</h2>
          <button onClick={connectMetamask} className="connectBtn">
            <img src={MetamaskLogo} alt="metamask" />
            Connect Metamask
          </button>
          <button onClick={connectWalletConnect} className="connectBtn">
            <img src={WalletConnect} alt="wallet" />
            Connect Wallet Connect
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
