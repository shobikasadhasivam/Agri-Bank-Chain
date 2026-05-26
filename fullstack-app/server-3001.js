const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AgriBankChain Server on PORT 3001' });
});

app.post('/channels/mychannel/chaincodes/agrichain', async (req, res) => {
  try {
    const { fcn, args = [] } = req.body;
    console.log(`🔗 Blockchain Call: ${fcn}`, args);

    const fabricPath = path.join(__dirname, '..', 'test-network');
    
    // Set environment
    process.env.PATH = path.join(fabricPath, '../bin') + ':' + process.env.PATH;
    process.env.FABRIC_CFG_PATH = path.join(fabricPath, '../config');
    process.env.CORE_PEER_TLS_ENABLED = 'true';
    process.env.CORE_PEER_LOCALMSPID = 'Org1MSP';
    process.env.CORE_PEER_TLS_ROOTCERT_FILE = path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
    process.env.CORE_PEER_MSPCONFIGPATH = path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');
    process.env.CORE_PEER_ADDRESS = 'localhost:7051';

    // Build command
    let command;
    const argsString = args.map(arg => `"${arg}"`).join(' ');
    
    if (fcn === 'ValidateHybridConsensus') {
      const operation = args[0] || 'DEFAULT_OPERATION';
      command = `peer chaincode query -C mychannel -n agrichain -c '{"function":"ValidateHybridConsensus","Args":["${operation}"]}'`;
    }
    else if (fcn.startsWith('Get')) {
      command = `peer chaincode query -C mychannel -n agrichain -c '{"function":"${fcn}","Args":[${argsString}]}'`;
    } else {
      command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${path.join(fabricPath, 'organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem')} -C mychannel -n agrichain --peerAddresses localhost:7051 --tlsRootCertFiles ${path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt')} --peerAddresses localhost:9051 --tlsRootCertFiles ${path.join(fabricPath, 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt')} -c '{"function":"${fcn}","Args":[${argsString}]}'`;
    }

    console.log(`🚀 Executing: ${command}`);

    const { stdout, stderr } = await execPromise(command, { 
      cwd: fabricPath,
      maxBuffer: 1024 * 1024 * 5
    });

    console.log('STDOUT:', stdout);
    if (stderr && !stderr.includes('Chaincode invoke successful')) {
      console.log('STDERR:', stderr);
    }

    // Parse response
    let result;
    try {
      const jsonMatch = stdout.match(/\{[^}]*\}/) || stdout.match(/\[.*\]/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else if (stdout.trim()) {
        result = { response: stdout.trim() };
      } else {
        result = { success: true, message: 'Operation completed' };
      }
    } catch (e) {
      result = { response: stdout.trim() };
    }

    console.log(`✅ Success:`, result);
    res.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message,
      stderr: error.stderr
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔄 AgriBankChain Server running on port ${PORT}`);
});
