// esto es simplemente para obtener los tipos
const sdk = /** @type {import("stellar-sdk")} */ (window.StellarSdk);

const { Keypair, Asset, Server, TransactionBuilder, Operation } = sdk;
const server = new Server('https://horizon-testnet.stellar.org');
// esto nunca se hace!! es sólo de ejemplo. El frontend siempre crea transacciones SIN firmar.
// Y luego se las envía a un servidor que tiene las llaves aseguradas para firmar.
// GCVNCIT5MGXR6PS6G4NT7MRWUSH5NK2KFBEOVITEDAWYN2OELKVV33YQ
const userAKeyPair = Keypair.fromSecret("SCFYENBUNWJOBSETNTJBYU2DCT4Q5N4W5BM4CHQMXXUIIKJ5CRP4D2QR");
// GBWARZDWJB6V7LYPNBE5BGY2PFVPSRM2GPKKHT5KZDS4VMWF6MUUMP4D
const userBKeyPair = Keypair.fromSecret("SBUIWFQYVUYDUWVV2XQSDATXHIID3EYB6S4ULZGORKQJNRXPQAGAP5KC");

const permissions = await xBullSDK.connect({
        canRequestPublicKey: true,
        canRequestSign: true
    });

async function loadBalances() {
    // Prestar atención a lo que pasa en el network tab
    const accountA = await server.loadAccount(userAKeyPair.publicKey());
    const accountB = await server.loadAccount(userBKeyPair.publicKey());
    const accountW = await server.loadAccount(xBullSDK.getPublicKey());

    const xlmBalanceA = accountA.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();
    const xlmBalanceB = accountB.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();
    const xlmBalanceW = accountW.balances.filter(balance => balance.asset_type === Asset.native().getAssetType()).pop();

    document.querySelector('#balance-a').textContent = xlmBalanceA.balance;
    document.querySelector('#balance-b').textContent = xlmBalanceB.balance;
    document.querySelector('#balance-w').textContent = xlmBalanceW.balance;

}

async function makePaymentWithW() {
 
    const publicKey = await xBullSDK.getPublicKey();
    const sourceAccount = await server.loadAccount(publicKey);
    //const sourceAccount = await server.loadAccount(userAKeyPair.publicKey());

    // el SOURCE ACCOUNT de una transacción es el SOURCE ACCOUNT de cada operación por default
    // cada operación puede tener un source distinto (en el próximo ejemplo lo vemos)

    // el SOURCE ACCOUNT sirve para obtener el SEQUENCE NUMBER, que incrementa de 1 en 1.
    // Si hay 2 transacciones de la misma cuenta con el mismo SEQUENCE NUMBER, sólo 1 puede ser enviada y la otra es considerada inválida.
    // También, quien construye la transacción, paga los fees de la red.
    //console.log(sourceAccount.sequenceNumber());
    // Una transacción puede tener hasta 100 operaciones dentro. Cada operación paga un fee.
    const tx = new TransactionBuilder(sourceAccount, {
        // con esto obtenemos los fees de la red. Si la red está congestionada y no enviamos suficientes fees, entonces nuestra transacción puede fallar.
        // más en https://horizon-testnet.stellar.org/fee_stats
        fee: await server.fetchBaseFee(),
        networkPassphrase: "Test SDF Network ; September 2015",
    }).addOperation(Operation.payment({
        amount: document.querySelector('#amount').value,
        asset: Asset.native(),
        destination: userBKeyPair.publicKey()
    }))
        .setTimeout(60 * 10) //10 minutos, luego la tx falla
        .build();

    console.log('tx con W:',tx.toXDR());
    const signedTransaction = await xBullSDK.signXDR(tx.toXDR());
    //tx.sign(userAKeyPair);
     console.log('Transaction con W:',signedTransaction);
    try {
        const txResult = await server.submitTransaction(signedTransaction);
        console.log('results:',txResult);
        loadBalances();
    } catch (e) {
        console.error('error:',e);
    }
}

async function makePaymentWithA() { 
 
    const sourceAccount = await server.loadAccount(userAKeyPair.publicKey());
   
    const tx = new TransactionBuilder(sourceAccount, {
  
        fee: await server.fetchBaseFee(),
        networkPassphrase: "Test SDF Network ; September 2015",
    }).addOperation(Operation.payment({
        amount: document.querySelector('#amount').value,
        asset: Asset.native(),
        destination: userBKeyPair.publicKey()
    }))
        .setTimeout(60 * 10) //10 minutos, luego la tx falla
        .build();

    console.log('tx con A:',tx.toXDR());
    tx.sign(userAKeyPair);
    console.log('Transaction con A:',signedTransaction);
    try {
        const txResult = await server.submitTransaction(signedTransaction);
        console.log('results:',txResult);
        loadBalances();
    } catch (e) {
        console.error('error:',e);
    }
}

document.querySelector('#load-balances').addEventListener('click', loadBalances);
document.querySelector('#make-payment-a').addEventListener('click', makePaymentWithA);
document.querySelector('#make-payment-w').addEventListener('click', makePaymentWithW);
