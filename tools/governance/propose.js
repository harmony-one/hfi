const yargs = require('yargs');
const argv = yargs
    .option('contract', {
        alias: 'c',
        description: 'The contract address',
        type: 'string'
    })
    .option('amount', {
        alias: 'a',
        description: 'The amount of tokens to stake',
        type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;


const 1earnGovernance = artifacts.require("1earnGovernance");
const 1FI = artifacts.require("1FI");
const 1CRV = artifacts.require("1CRV");

const { fromBech32, toBech32 } = require("@harmony-js/crypto");

const D = console.log;

let govInstance
let govAddress
let tokenInstance
let tokenAddress

const walletAddress = 1earnGovernance.currentProvider.addresses[0];

function argvCheck() {
    govAddress = argv.contract ? argv.contract : 1earnGovernance.address;
    if (!govAddress)
        throw 'You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!';
}


async function init() {
    argvCheck();
    govInstance = await 1earnGovernance.at(govAddress);
    tokenAddress = await govInstance.1FI.call();
    tokenInstance = await 1FI.at(tokenAddress);
}

const web3 = require('web3');

async function tokenStatus() {
    console.log(`1FI token address: ${tokenAddress}`);
    let total = await tokenInstance.totalSupply();
    console.log(`Current total supply of the hfi token is: ${web3.utils.fromWei(total)}`);

    let balance = await tokenInstance.balanceOf(walletAddress);
    console.log(`Balance of hfi token ${tokenAddress} for address ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);
}

async function propose() {
    console.log('before proposal:');
    let proposalCount = await govInstance.proposalCount();
    console.log(`\t proposalCount: ${proposalCount.toString()}`)
    let voteLock = await govInstance.voteLock(walletAddress);
    console.log(`\t voteLock of ${walletAddress}: ${voteLock.toString()}`)

    console.log('doing a proposal...')
    const proposeResult = await govInstance.propose();
    console.log(`Propose transaction hash: ${proposeResult.tx}\n`);

    console.log('after a proposal:');
    proposalCount = await govInstance.proposalCount();
    console.log(`\t proposalCount: ${proposalCount.toString()}`)
    voteLock = await govInstance.voteLock(walletAddress);
    console.log(`\t voteLock of ${walletAddress}: ${voteLock.toString()}`)

    const proposal = await govInstance.proposals(proposalCount - 1);
    console.log(`proposal(${proposalCount - 1}):`);
    console.table({
        id: proposal.id.toString(),
        proposer: toBech32(proposal.proposer),
        totalAgree: proposal.totalForVotes.toString(),
        totalAgainst: proposal.totalAgainstVotes.toString(),
        startBlockNo: proposal.start.toString(),
        endBlockNo: proposal.end.toString(),
    });
}

module.exports = function (result) {
    return init()
        .then(tokenStatus)
        .then(propose)
        .then(result).catch(result);
}
