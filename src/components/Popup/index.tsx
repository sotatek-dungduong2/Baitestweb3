import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import Web3 from "web3";
import { MASTERCHEF_ADDRESS, STAKE, WITHDRAW } from "../../utils/common.const";
import MASTERCHEF_ABI from "../../utils/MasterchefABI.json";
import "./index.css";
import ClosePopup from "../../assets/img/close-popup.svg";

const Popup = (props: any) => {
  const [inputValue, setInputValue] = useState("");
  const { closePopup, handleAfterCall, updateLoading } = props;
  const { account, library } = useWeb3React();

  const convertNumber = (number: string) => {
    const web3 = new Web3(library.provider);
    return web3.utils.toWei(number);
  };

  const handleError = (error: any) => {
    if (error) {
      alert(error.message);
    }
  };

  const handleAction = async () => {
    const contract = renderContract(MASTERCHEF_ABI as any, MASTERCHEF_ADDRESS);
    updateLoading(true);
    try {
      switch (props.action) {
        case STAKE:
          await contract.methods.deposit(convertNumber(inputValue)).send({
            from: account,
          });
          handleAfterCall(STAKE);
          break;
        case WITHDRAW:
          await contract.methods.withdraw(convertNumber(inputValue)).send({
            from: account,
          });
          handleAfterCall(WITHDRAW);
          break;
      }
    } catch (error) {
      updateLoading(false);
      handleError(error);
    }
  };

  const renderContract = (contractAbi: any, address: string) => {
    const web3 = new Web3(library.provider);
    const contract = new web3.eth.Contract(contractAbi, address);
    return contract;
  };

  return (
    <div className="popup">
      <div className="popup-header">
        <h3>{props.action === STAKE ? STAKE : WITHDRAW}</h3>
        <img
          onClick={closePopup}
          className="close"
          src={ClosePopup}
          alt="close"
        />
      </div>
      <div className="popup-body">
        <input
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
          type="text"
          placeholder="Please input your amount"
        />
        <p>Your WETH balance: {props.number} WETH</p>
        <button onClick={handleAction}>
          {" "}
          {props.action === STAKE ? STAKE : WITHDRAW}
        </button>
      </div>
    </div>
  );
};

export default Popup;
