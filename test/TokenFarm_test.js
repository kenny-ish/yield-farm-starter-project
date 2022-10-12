const DappToken = artifacts.require(`DappToken`)
const DaiToken = artifacts.require(`DaiToken`)
const TokenFarm = artifacts.require(`TokenFarm`)

require(`chai`).use(require('chai-as-promised')).should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () =>{
        //コントラクトの読み込み
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        //全てのDappトークンをファームに移動する(1 million)
        await dappToken.transfer(tokenFarm.address, tokens('1000000'));

        await daiToken.transfer(investor, tokens('1000'), {from: owner})
    })
    // テスト1
    describe('Mock DAI deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'GETH Token')
        })
    })
    // テスト2
    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'Web3ish Token')
        })
    })

    describe('Token Farm deployment', async () => {
        // テスト3
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, "Web3ish Token Farm")
        })
        // テスト4
        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            // テスト5. ステーキングの前に投資家の残高を確認する
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('1000'), 'investor Mock DAI wallet balance correct before staking')

            // テスト6. 偽のDAIトークンを確認する
            await daiToken.approve(tokenFarm.address, tokens('1000'), {from: investor})
            await tokenFarm.stakeTokens(tokens('1000'), {from: investor})

            // テスト7. ステーキング後の投資家の残高を確認する
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

            // テスト8. ステーキング後のTokenFarmの残高を確認する
            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('1000'), 'Token Farm Mock DAI balance correct after staking')

            // テスト9. 投資家がTokenFarmにステーキングした残高を確認する
            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('1000'), 'investor staking balance correct after staking')

            // テスト10. ステーキングを行った投資家の状態を確認する
            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

            // ----- 追加するテストコード ------ //

            // トークンを発行する
            await tokenFarm.issueTokens({from: owner})

            // トークンを発行した後の投資家の Dapp 残高を確認する
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('1000'), 'investor DApp Token wallet balance correct after staking')

            // あなた（owner）のみがトークンを発行できることを確認する（もしあなた以外の人がトークンを発行しようとした場合、却下される）
            await tokenFarm.issueTokens({from: investor}).should.be.rejected

            //トークンをアンステーキングする
            await tokenFarm.unstakeTokens({from: investor})

            //テスト11. アンステーキングの結果を確認する
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('1000'), 'investor Mock DAI wallet balance correct after staking')

            //テスト12.投資家がアンステーキングした後の Token Farm 内に存在する偽の Dai 残高を確認する
            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking')

            //テスト13. 投資家がアンステーキングした後の投資家の残高を確認する
            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking status correct after staking')

            //テスト14. 投資家がアンステーキングした後の投資家の状態を確認する
            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after staking')

        })
    })
})