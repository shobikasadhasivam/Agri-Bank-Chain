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
  res.json({ status: 'OK', message: 'AgriBankChain FIXED Server' });
});

app.post('/channels/mychannel/chaincodes/agrichain', async (req, res) => {
  try {
    const { fcn, args = [] } = req.body;
    console.log('=== NEW REQUEST ===');
    console.log('Function:', fcn);
    console.log('Arguments:', args);
    
    const fabricPath = path.join(__dirname, '..', 'test-network');
    
    // Set environment
    const env = {
      ...process.env,
      PATH: path.join(fabricPath, '../bin') + ':' + process.env.PATH,
      FABRIC_CFG_PATH: path.join(fabricPath, '../config'),
      CORE_PEER_TLS_ENABLED: 'true',
      CORE_PEER_LOCALMSPID: 'Org1MSP',
      CORE_PEER_TLS_ROOTCERT_FILE: path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt'),
      CORE_PEER_MSPCONFIGPATH: path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp'),
      CORE_PEER_ADDRESS: 'localhost:7051'
    };

    let command;
    
    // BULLETPROOF: Handle ValidateHybridConsensus specifically
    if (fcn === 'ValidateHybridConsensus') {
      const operation = args[0] || 'DEFAULT_OPERATION';
      command = `cd "${fabricPath}" && peer chaincode query -C mychannel -n agrichain -c '{"function":"ValidateHybridConsensus","Args":["${operation}"]}'`;
      console.log('🎯 USING QUERY WITH ARGUMENT:', command);
    }
    // Handle other query functions
    else if (fcn.startsWith('Get') || fcn === 'ReadCrop' || fcn === 'GetAvailableCrops' || fcn === 'GetCropsByFarmer' || fcn === 'GetCropsByType' || fcn === 'GetCropHistory') {
      const argsString = args.map(arg => `"${arg}"`).join(', ');
      command = `cd "${fabricPath}" && peer chaincode query -C mychannel -n agrichain -c '{"function":"${fcn}","Args":[${argsString}]}'`;
      console.log('📖 QUERY Command:', command);
    }
    // Handle invoke functions
    else {
      const argsString = args.map(arg => `"${arg}"`).join(', ');
      const ordererCert = path.join(fabricPath, 'organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
      const org1Cert = path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
      const org2Cert = path.join(fabricPath, 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt');
      
      command = `cd "${fabricPath}" && peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${ordererCert}" -C mychannel -n agrichain --peerAddresses localhost:7051 --tlsRootCertFiles "${org1Cert}" --peerAddresses localhost:9051 --tlsRootCertFiles "${org2Cert}" -c '{"function":"${fcn}","Args":[${argsString}]}'`;
      console.log('✍️ INVOKE Command:', command);
    }

    console.log('FINAL COMMAND:', command);

    const { stdout, stderr } = await execPromise(command, { 
      env: env,
      maxBuffer: 1024 * 1024 * 5
    });

    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    // Parse response
    let result;
    try {
      // Try multiple JSON extraction patterns
      let jsonString = stdout;
      const jsonMatch = stdout.match(/\{[^}]*\}/) || 
                       stdout.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/) ||
                       stdout.match(/\[.*\]/);
      
      if (jsonMatch) {
        jsonString = jsonMatch[0];
        result = JSON.parse(jsonString);
      } else if (stdout.trim() && !stdout.includes('Error:')) {
        result = { response: stdout.trim() };
      } else {
        result = { success: true, message: 'Operation completed' };
      }
    } catch (e) {
      console.log('JSON parse failed, returning raw:', stdout);
      result = { raw: stdout.trim() };
    }

    console.log('✅ FINAL RESULT:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ FINAL ERROR:', error);
    console.log('Error stdout:', error.stdout);
    console.log('Error stderr:', error.stderr);
    res.status(500).json({ 
      error: error.message,
      command: error.cmd,
      stderr: error.stderr
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('=========================================');
  console.log('🚀 AgriBankChain BULLETPROOF Server');
  console.log('✅ PORT: 3000');
  console.log('✅ ValidateHybridConsensus WILL USE QUERY');
  console.log('✅ Arguments WILL BE PASSED CORRECTLY');
  console.log('=========================================');
});
