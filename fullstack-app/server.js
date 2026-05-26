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
  res.json({ status: 'OK', message: 'AgriBankChain REST API running' });
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

    // Build command - FIXED: Proper JSON formatting for arguments
    let command;
    
    // Create properly formatted JSON for arguments
    const argsJSON = JSON.stringify(args);
    const functionCallJSON = JSON.stringify({
      function: fcn,
      Args: args
    });

    console.log('🔍 Args received:', args);
    console.log('🔍 Args JSON:', argsJSON);
    console.log('🔍 Function call JSON:', functionCallJSON);

    if (fcn === 'ValidateHybridConsensus') {
      if (args.length > 0) {
        command = `peer chaincode query -C mychannel -n agrichain -c '${functionCallJSON}'`;
      } else {
        command = `peer chaincode query -C mychannel -n agrichain -c '{"function":"ValidateHybridConsensus","Args":["DEFAULT_OPERATION"]}'`;
      }
      console.log('🎯 Using QUERY for ValidateHybridConsensus');
    }
    else if (fcn.startsWith('Get') || fcn === 'ValidateHybridConsensus') {
      command = `peer chaincode query -C mychannel -n agrichain -c '${functionCallJSON}'`;
      console.log('📖 Using QUERY for read function');
    } else {
      // For write operations - FIXED: Use proper JSON formatting
      command = `peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${path.join(fabricPath, 'organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem')} -C mychannel -n agrichain --peerAddresses localhost:7051 --tlsRootCertFiles ${path.join(fabricPath, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt')} --peerAddresses localhost:9051 --tlsRootCertFiles ${path.join(fabricPath, 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt')} -c '${functionCallJSON}'`;
      console.log('✍️ Using INVOKE for write function');
    }

    console.log(`🚀 Executing: ${command}`);

    const { stdout, stderr } = await execPromise(command, { 
      cwd: fabricPath,
      maxBuffer: 1024 * 1024 * 10
    });

    console.log('STDOUT:', stdout);
    if (stderr && !stderr.includes('Chaincode invoke successful')) {
      console.log('STDERR:', stderr);
    }

    // Enhanced response parsing
    let result;
    try {
      // For GetAllCrops, handle array response
      if (fcn === 'GetAllCrops') {
        console.log('🔄 Processing GetAllCrops response...');
        const jsonMatch = stdout.match(/\[.*\]/s);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
          console.log(`✅ Successfully parsed ${result.length} crops`);
        } else {
          const anyJsonMatch = stdout.match(/\{[^}]*\}/);
          if (anyJsonMatch) {
            result = [JSON.parse(anyJsonMatch[0])];
            console.log(`✅ Found single crop, wrapped in array`);
          } else {
            console.log('❌ No JSON found in response');
            result = [];
          }
        }
      } else {
        // For other functions
        const jsonMatch = stdout.match(/\{[^}]*\}/) || stdout.match(/\[.*\]/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else if (stdout.includes('Chaincode invoke successful')) {
          result = { success: true, message: 'Transaction completed successfully' };
        } else if (stdout.trim()) {
          result = { response: stdout.trim() };
        } else {
          result = { success: true, message: 'Operation completed' };
        }
      }
    } catch (e) {
      console.error('❌ JSON parsing error:', e);
      // If invoke was successful but no JSON, return success
      if (stdout.includes('Chaincode invoke successful')) {
        result = { success: true, message: 'Transaction completed successfully' };
      } else {
        result = { response: stdout.trim() };
      }
    }

    console.log(`✅ Final result for ${fcn}:`, result);
    res.json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message,
      stderr: error.stderr,
      message: 'Blockchain operation failed'
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🔄 AgriBankChain Server running on port ${PORT}`);
  console.log(`✅ JSON formatting fixed - purchases should work now!`);
});