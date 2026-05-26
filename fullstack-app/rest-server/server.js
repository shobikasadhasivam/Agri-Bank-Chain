const express = require('express');
const app = express();
app.use(express.json());

// Mock data for testing - remove this when blockchain is connected
const mockCrops = [
  {
    ID: "crop1",
    Name: "Basmati Rice",
    Type: "rice",
    Quantity: 1000,
    Price: 2.5,
    Farmer: "Farmer John",
    Status: "available",
    Location: "Punjab",
    PlantedDate: "2024-01-15",
    HarvestDate: "2024-04-20",
    Quality: "premium",
    Description: "Organic basmati rice"
  }
];

// ========== CROP ENDPOINTS ==========

// Get all crops
app.get('/crops', async (req, res) => {
  try {
    console.log('GET /crops - Fetching all crops');
    // In real implementation, this would call: await queryChaincode('GetAllCrops', []);
    res.json(mockCrops);
  } catch (error) {
    console.error('Error getting crops:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create crop
app.post('/crops', async (req, res) => {
  try {
    const { id, name, type, quantity, price, farmer, location, plantedDate, harvestDate, quality, description } = req.body;

    if (!id || !name || !type || !quantity || !price || !farmer || !location || !plantedDate || !harvestDate || !quality || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log('POST /crops - Creating crop:', { id, name, type, quantity, price, farmer });

    // In real implementation, this would call:
    // await invokeChaincode('CreateCrop', [id, name, type, quantity.toString(), price.toString(), farmer, location, plantedDate, harvestDate, quality, description]);
    
    const newCrop = {
      ID: id,
      Name: name,
      Type: type,
      Quantity: quantity,
      Price: price,
      Farmer: farmer,
      Location: location,
      PlantedDate: plantedDate,
      HarvestDate: harvestDate,
      Quality: quality,
      Description: description,
      Status: "available",
      Buyer: ""
    };
    
    mockCrops.push(newCrop);
    
    res.json({ success: true, crop: newCrop });
  } catch (error) {
    console.error('Error creating crop:', error);
    res.status(500).json({ error: error.message });
  }
});

// Purchase crop
app.post('/crops/:id/purchase', async (req, res) => {
  try {
    const cropId = req.params.id;
    const { buyer } = req.body;

    if (!buyer) {
      return res.status(400).json({ error: 'Buyer is required' });
    }

    console.log('POST /crops/purchase - Purchasing crop:', { cropId, buyer });

    // In real implementation, this would call: await invokeChaincode('PurchaseCrop', [cropId, buyer]);
    
    const crop = mockCrops.find(c => c.ID === cropId);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }
    
    if (crop.Status === 'sold') {
      return res.status(400).json({ error: 'Crop is already sold' });
    }
    
    crop.Buyer = buyer;
    crop.Status = 'sold';
    
    res.json({ success: true, crop });
  } catch (error) {
    console.error('Error purchasing crop:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CONSENSUS ENDPOINTS ==========

// Get consensus information - REAL endpoint that calls your chaincode
app.get('/consensus/info', async (req, res) => {
  try {
    console.log('GET /consensus/info - Fetching consensus info');
    // This calls your actual chaincode function
    // const result = await queryChaincode('GetConsensusInfo', []);
    
    // For now, return the structure your chaincode provides
    const result = {
      consensusModel: "Hybrid PoA+PBFT+DPoS",
      description: "Combines Proof of Authority for banks/government, Practical Byzantine Fault Tolerance for reliability, and Delegated Proof of Stake for farmer participation",
      poaValidators: [
        {"mspId": "BankMSP", "role": "bank", "orgName": "Reserve Bank"},
        {"mspId": "GovernmentMSP", "role": "government", "orgName": "Agriculture Ministry"},
        {"mspId": "BankMSP2", "role": "bank", "orgName": "Cooperative Bank"}
      ],
      dposValidators: [
        {"mspId": "FarmerCoop1MSP", "stake": 1000, "orgName": "Farmer Cooperative 1"},
        {"mspId": "FarmerCoop2MSP", "stake": 800, "orgName": "Farmer Cooperative 2"},
        {"mspId": "BuyerConsortiumMSP", "stake": 1200, "orgName": "Buyer Consortium"}
      ],
      pbftConfig: {
        totalNodes: 7,
        faultyNodes: 2,
        faultTolerance: "Can tolerate up to 2 faulty nodes (n >= 3f+1)"
      },
      validationRules: {
        poa: "2/3 of Bank/Government validators must approve",
        dpos: "51% of total stake must approve", 
        pbft: "n - f nodes must participate (where n >= 3f+1)"
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error getting consensus info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate hybrid consensus - REAL endpoint that calls your chaincode
app.post('/consensus/validate', async (req, res) => {
  try {
    const { operation } = req.body;
    if (!operation) {
      return res.status(400).json({ error: 'Operation type is required' });
    }

    console.log('POST /consensus/validate - Validating consensus for:', operation);
    
    // This calls your actual chaincode function
    // const result = await invokeChaincode('ValidateHybridConsensus', [operation]);
    
    // For now, simulate based on your chaincode logic
    let result;
    switch(operation) {
      case 'CREATE_CROP':
        result = {
          Valid: true,
          PoAApprovals: 3,
          DPoSStake: 3000,
          TotalNodes: 7,
          Message: "Hybrid consensus passed: PoA=3/3, DPoS=3000/3600 stake, PBFT=7/7 nodes"
        };
        break;
      case 'HIGH_VALUE_PURCHASE':
        result = {
          Valid: true,
          PoAApprovals: 2,
          DPoSStake: 2500,
          TotalNodes: 6,
          Message: "Hybrid consensus passed: PoA=2/3, DPoS=2500/3600 stake, PBFT=6/7 nodes"
        };
        break;
      case 'TRANSFER_OWNERSHIP':
        result = {
          Valid: false,
          PoAApprovals: 1,
          DPoSStake: 1500,
          TotalNodes: 5,
          Message: "Hybrid consensus failed: PoA=1/3, DPoS=1500/3600 stake, PBFT=5/7 nodes"
        };
        break;
      default:
        result = {
          Valid: true,
          PoAApprovals: 2,
          DPoSStake: 2800,
          TotalNodes: 7,
          Message: "Hybrid consensus passed for " + operation
        };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error validating consensus:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AgriBankChain REST server is running',
    endpoints: {
      crops: '/crops',
      createCrop: 'POST /crops',
      purchaseCrop: 'POST /crops/:id/purchase',
      consensusInfo: '/consensus/info',
      validateConsensus: 'POST /consensus/validate'
    }
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ AgriBankChain REST server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📍 Crops: http://localhost:${port}/crops`);
  console.log(`📍 Consensus: http://localhost:${port}/consensus/info`);
  console.log('🚀 Server ready!');
});
