import React, { Component } from 'react'
import Web3 from 'web3'
import DaiToken from '../abis/DaiToken.json'
import DappToken from '../abis/DappToken.json'
import TokenFarm from '../abis/TokenFarm.json'
import Navbar from './Navbar'
import Main from './Main'
import './App.css'

class App extends Component {
  // componentWillMount(): 主にサーバーへのAPIコールを行うなど、実際のレンダリングが行われる前にサーバーサイドのロジックを実装するために使用。
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  // loadBlockchainData(): ブロックチェーン上のデータとやり取りするための関数
  // MetaMask との接続によって得られた情報とコントラクトとの情報を使って描画に使う情報を取得。
  async loadBlockchainData() {
    const web3 = window.web3
    // ユーザーの Metamask の一番最初のアカウント（複数アカウントが存在する場合）取得
    const accounts = await web3.eth.getAccounts()
    // ユーザーの Metamask アカウントを設定
    // この機能により、App.js に記載されている constructor() 内の account（デフォルト: '0x0'）が更新される
    this.setState({ account: accounts[0]})
    // ユーザーが Metamask を介して接続しているネットワークIDを取得
    const networkId = await web3.eth.net.getId()

    // DaiToken のデータを取得
    const daiTokenData = DaiToken.networks[networkId]
    if(daiTokenData){
      // DaiToken の情報を daiToken に格納する
      const daiToken = new web3.eth.Contract(DaiToken.abi, daiTokenData.address)
      // constructor() 内の daiToken の情報を更新する
      this.setState({daiToken})
      // ユーザーの Dai トークンの残高を取得する
      let daiTokenBalance = await daiToken.methods.balanceOf(this.state.account).call()
      // daiTokenBalance（ユーザーの Dai トークンの残高）をストリング型に変更する
      this.setState({daiTokenBalance: daiTokenBalance.toString()})
      // ユーザーの Dai トークンの残高をフロントエンドの Console に出力する
      console.log(daiTokenBalance.toString())
    }else{
      window.alert('DaiToken contract not deployed to detected network.')
    }
    // ↓ --- 1. 追加するコード ---- ↓
    // DappToken のデータを取得
    const dappTokenData = DappToken.networks[networkId]
    if(dappTokenData){
      // DappToken の情報を dappToken に格納する
      const dappToken = new web3.eth.Contract(DappToken.abi, dappTokenData.address)
      // constructor() 内の dappToken の情報を更新する
      this.setState({dappToken})
      // ユーザーの Dapp トークンの残高を取得する
      let dappTokenBalance = await dappToken.methods.balanceOf(this.state.account).call()
      // dappTokenBalance（ユーザーの Dapp トークンの残高）をストリング型に変更する
      this.setState({dappTokenBalance: dappTokenBalance.toString()})
      // ユーザーの Dapp トークンの残高をフロントエンドの Console に出力する
      console.log(dappTokenBalance.toString())
    }else{
      window.alert('DappToken contract not deployed to detected network.')
    }

    // tokenFarmData のデータを取得
    const tokenFarmData = TokenFarm.networks[networkId]
    if(tokenFarmData){
      // TokenFarm の情報を tokenFarm に格納する
      const tokenFarm = new web3.eth.Contract(TokenFarm.abi, tokenFarmData.address)
      // constructor() 内の tokenFarm の情報を更新する
      this.setState({tokenFarm})
      // tokenFarm 内にステーキングされている Dai トークンの残高を取得する
      let tokenFarmBalance = await tokenFarm.methods.stakingBalance(this.state.account).call()
      // tokenFarmBalance をストリング型に変更する
      this.setState({stakingBalance: tokenFarmBalance.toString()})
      // ユーザーの tokenFarmBalance をフロントエンドの Console に出力する
      console.log(tokenFarmBalance.toString())
    }else{
      window.alert('TokenFarm contract not deployed to detected network.')
    }
    // ↑ --- 1. 追加するコード ---- ↑
  }
  // loadWeb3(): ユーザーが Metamask アカウントを持っているか確認する関数
  async loadWeb3() {
    // ユーザーが Metamask のアカウントを持っていた場合は、アドレスを取得
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    // ユーザーが Metamask のアカウントを持っていなかった場合は、エラーを返す
    else {
      window.alert('Non ethereum browser detected. You should consider trying to install metamask')
    }

    this.setState({ loading: false})
  }
  // ↓ --- 2. 追加するコード ---- ↓
  // TokenFarm.sol に記載されたステーキング機能を呼び出す
  stakeTokens = (amount) => {
    this.setState({loading: true})
    this.state.daiToken.methods.approve(this.state.tokenFarm._address, amount).send({from: this.state.account}).on('transactionHash', (hash)=> {
      this.state.tokenFarm.methods.stakeTokens(amount).send({from: this.state.account}).on('transactionHash', (hash) => {
        this.setState({loading: false})
      })
    })
  }
  // TokenFarm.sol に記載されたアンステーキング機能を呼び出す
  unstakeTokens = (amount) => {
    this.setState({loading: true})
    this.state.tokenFarm.methods.unstakeTokens().send({from: this.state.account}).on('transactionHash', (hash) => {
      this.setState({loading: false})
    })
  }
  // ↑ --- 2. 追加するコード ---- ↑

  // constructor(): ブロックチェーンから読み込んだデータ + ユーザーの状態を更新する関数
  constructor(props) {
    super(props)
    this.state = {
      account: '0x0',
      daiToken: {},
      dappToken: {},
      tokenFarm: {},
      daiTokenBalance: '0',
      dappTokenBalance: '0',
      stakingBalance: '0',
      loading: true
    }
  }

  // フロントエンドのレンダリングが以下で実行される
  render() {
    let content
    if(this.state.loading){
      content = <p id='loader' className='text-center'>Loading...</p>
    }else{
      content = <Main
        daiTokenBalance = {this.state.daiTokenBalance}
        dappTokenBalance = {this.state.dappTokenBalance}
        stakingBalance = {this.state.stakingBalance}
        stakeTokens = {this.stakeTokens}
        unstakeTokens={this.unstakeTokens}
      />
    }
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                </a>

                {content}

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;