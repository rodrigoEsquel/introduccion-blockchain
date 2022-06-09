// esto es simplemente para obtener los tipos
const sdk = /** @type {import("stellar-sdk")} */ (window.StellarSdk);

const { Keypair, Asset, Server, TransactionBuilder, Operation, Transaction, Network } = sdk;
const server = new Server('https://horizon-testnet.stellar.org');
// esto nunca se hace!! es sólo de ejemplo. El frontend siempre crea transacciones SIN firmar.
// Y luego se las envía a un servidor que tiene las llaves aseguradas para firmar.
// GCVNCIT5MGXR6PS6G4NT7MRWUSH5NK2KFBEOVITEDAWYN2OELKVV33YQ
const userAKeyPair = Keypair.fromSecret("SCFYENBUNWJOBSETNTJBYU2DCT4Q5N4W5BM4CHQMXXUIIKJ5CRP4D2QR");
// GBWARZDWJB6V7LYPNBE5BGY2PFVPSRM2GPKKHT5KZDS4VMWF6MUUMP4D
const userBKeyPair = Keypair.fromSecret("SBUIWFQYVUYDUWVV2XQSDATXHIID3EYB6S4ULZGORKQJNRXPQAGAP5KC");



async function loadBalances() {
    // Prestar atención a lo que pasa en el network tab
    const permissions = await xBullSDK.connect({
        canRequestPublicKey: true,
        canRequestSign: true
    });

    const accountA = await server.loadAccount(userAKeyPair.publicKey());
    const accountB = await server.loadAccount(userBKeyPair.publicKey());
    
    const xlmBalanceA = accountA.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();
    const xlmBalanceB = accountB.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();
    
    document.querySelector('#balance-a').textContent = xlmBalanceA.balance;
    document.querySelector('#balance-b').textContent = xlmBalanceB.balance;

    if (permissions.canRequestPublicKey) {
        const accountW = await server.loadAccount(xBullSDK.getPublicKey());
        const xlmBalanceW = accountW.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();
        document.querySelector('#balance-w').textContent = xlmBalanceW.balance;
    }

}

async function makePaymentWithW() {
 
    const publicKey = await xBullSDK.getPublicKey();
    const sourceAccount = await server.loadAccount(publicKey);
  
    const tx = new TransactionBuilder(sourceAccount, {
    
        fee: await server.fetchBaseFee(),
        networkPassphrase: "Test SDF Network ; September 2015",
    }).addOperation(Operation.payment({
        amount: String(document.querySelector('#amount').value),
        asset: Asset.native(),
        destination: userBKeyPair.publicKey()
    }))
        .setTimeout(60 * 10) 
        .build();

    console.log('tx con W:',tx.toXDR());
    const signedXDR = await xBullSDK.signXDR(tx.toXDR());
    console.log('XDR con W:',signedXDR);
    const signedTx = new Transaction(signedXDR,Network.TESTNET);
    console.log('tx firmada con W:',signedTx);
    
    
    
    try {
        const txResult = await server.submitTransaction(signedTx);
        console.log('results:',txResult);
        loadBalances();
    } catch (e) {
        console.error('error:',e);
    }
}

async function makePaymentWithA() { 
 
    const sourceAccount = await server.loadAccount(userAKeyPair.publicKey());

    console.log(sourceAccount.sequenceNumber());

  ;
    const tx = new TransactionBuilder(sourceAccount, {

        fee: await server.fetchBaseFee(),
        networkPassphrase: "Test SDF Network ; September 2015",
    }).addOperation(Operation.payment({
        amount: String(document.querySelector('#amount').value),
        asset: Asset.native(),
        destination: userBKeyPair.publicKey()
    }))
        .setTimeout(60 * 10) //10 minutos, luego la tx falla
        .build();

    console.log('tx con A:',tx.toXDR());
    tx.sign(userAKeyPair);
    console.log('Transaction con A:',tx);

    try {
        const txResult = await server.submitTransaction(tx);
        console.log(txResult);
        loadBalances();
    } catch (e) {
        console.error(e);
    }
}


document.querySelector('#load-balances').addEventListener('click', loadBalances);
document.querySelector('#make-payment-a').addEventListener('click', makePaymentWithA);
document.querySelector('#make-payment-w').addEventListener('click', makePaymentWithW);
