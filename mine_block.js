const fs = require('fs');
const crypto = require('crypto');
const merkle = require('merkle');
const { Transaction, TransactionOutput } = require('bitcoinjs-lib');



// Load all JSON files from the mempool folder
const mempoolFiles = fs.readdirSync('./mempool').filter(file => file.endsWith('.json'));

// Placeholder for block reward and transaction fees
const blockReward = 6.25; // Block reward in BTC (current reward for successful mining)

// Function to validate transaction
function validateTransaction(transaction) {
    // Placeholder for validation logic using bitcoinjs-lib
    try {
        const tx = Transaction.fromHex(transaction.data);
        // Check if transaction inputs and outputs are valid
        for (const input of tx.ins) {
            // Placeholder for input validation
            // Here you can check if the input exists, is not already spent, and is correctly signed
        }
        for (const output of tx.outs) {
            // Placeholder for output validation
            // Here you can check if the output amount is valid and the script is well-formed
        }
        return true; // Transaction is considered valid
    } catch (error) {
        console.error(`Error validating transaction ${transaction.txid}: ${error.message}`);
        return false; // Transaction is considered invalid
    }
}

// Function to generate coinbase transaction
function generateCoinbaseTransaction() {
    const tx = new Transaction();
    // Add input
    tx.addInput(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), 0xFFFFFFFF, 0xFFFFFFFE);
    // Add output
    tx.addOutput(Buffer.from('0000000000000000000000000000000000000000', 'hex'), blockReward * 1e8);
    return tx.toHex();
}

// Function to construct block header
function constructBlockHeader(prevBlockHash, merkleRootHash) {
    const version = 1;
    const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
    const bits = 0x1d00ffff; // Target difficulty
    let nonce = 0;
    let blockHash;
    do {
        const header = Buffer.alloc(80);
        header.writeUInt32LE(version, 0);
        header.write(prevBlockHash, 4, 32, 'hex');
        header.writeUInt32LE(timestamp, 36);
        header.writeUInt32LE(bits, 72);
        header.writeUInt32LE(nonce, 76);
        blockHash = crypto.createHash('sha256').update(header).digest('hex');
        nonce++;
    } while (parseInt(blockHash, 16) > 0x0000ffff * 2 ** (256 - 32 - 4 * bits));
    return { blockHash, nonce, merkleRootHash, timestamp, bits };
}

// Validate and mine transactions
const validTransactions = [];
const transactionData = [];
mempoolFiles.forEach(file => {
    const transaction = JSON.parse(fs.readFileSync(`./mempool/${file}`, 'utf-8'));
    if (validateTransaction(transaction)) {
        validTransactions.push(transaction);
        transactionData.push(Buffer.from(transaction.data, 'hex'));
    }
});

// Generate coinbase transaction
const coinbaseTransaction = generateCoinbaseTransaction();

// Construct merkle tree
const tree = merkle('sha256').sync(transactionData);
const merkleRootHash = tree.root().toString('hex');

// Construct block header
const prevBlockHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Placeholder for previous block hash
const { blockHash, nonce, timestamp, bits } = constructBlockHeader(prevBlockHash, merkleRootHash);

// Write output to output.txt
const outputContent = `${blockHash}\n${coinbaseTransaction}\n`;
validTransactions.forEach(tx => {
    outputContent += `${tx.txid}\n`;
});
fs.writeFileSync('output.txt', outputContent);

console.log('Block mined successfully! Check output.txt for details.');
