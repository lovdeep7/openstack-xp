import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import Dashbord from "./Dashbord";
import { GithubLoginButton } from "react-social-login-buttons";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import axios from "axios";

const MetaConnect = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);

  const [github, setGithub] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", accountsChanged);
      window.ethereum.on("chainChanged", chainChanged);
    }

    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      axios
        .post(process.env.REACT_APP_API_URI + "/github", { github_code: code })
        .then((res) => {
          const { access_token } = res.data;
          setGithub(access_token);
          window.history.replaceState({}, document.title, "/");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);
  const connectHandler = async () => {
    if (window.ethereum) {
      try {
        const res = await window.ethereum.request({
          method: "eth_requestAccounts"
        });
        await accountsChanged(res[0]);
        // console.log(res);
        // const res2 = await window.ethereum.isConnected();
        // console.log(res2);
        // const res3 = await window.ethereum.selectedAddress;
        // console.log(res3);
      } catch (err) {
        console.error(err);
        setErrorMessage("There was a problem connecting to MetaMask");
      }
    } else {
      setErrorMessage("Install MetaMask");
    }
  };
  const accountsChanged = async (newAccount) => {
    setAccount(newAccount);
    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [newAccount.toString(), "latest"]
      });
      setBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error(err);
      setErrorMessage("There was a problem connecting to MetaMask");
    }
  };

  const chainChanged = () => {
    setErrorMessage(null);
    setAccount(null);
    setBalance(null);
    window.location.reload();
  };

  const onGithubLogin = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_CLIENT_ID}&scope=read:user&redirect_uri=${process.env.REACT_APP_GITHUB_REDIRECT_URI}`;

    window.location.href = url;
  };

  return (
    <Container>
      {!github ? (
        <>
          <Row>
            <Col xs={{ offset: 2, span: 8 }} md={{ offset: 4, span: 4 }}>
              <GithubLoginButton onClick={onGithubLogin} />
            </Col>
          </Row>
        </>
      ) : (
        <div>
          <h6>Github: {github}</h6>
          <h6> Account: {account} </h6>
          <h6>
            Balance: {balance} {balance ? "ETH" : null}
          </h6>
          {!account ? (
            <Button
              className="bg-primary border border-0 m-2"
              onClick={connectHandler}
            >
              Connect Metamask Account
            </Button>
          ) : (
            <>
              <Button
                className="bg-success border border-0 m-2"
                onClick={() => {
                  setAccount(null);
                  setBalance(null);
                  setErrorMessage(null);
                }}
              >
                Connected. Dicsonnect?
              </Button>
              <Dashbord account={account} github={github} />
            </>
          )}
          {errorMessage ? (
            <p style={{ color: "red" }}>Error: {errorMessage}</p>
          ) : null}
        </div>
      )}
    </Container>
  );
};

export default MetaConnect;
