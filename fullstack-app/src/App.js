import React, { useState, useEffect } from 'react';
import BlockchainService from './services/blockchain';
import './App.css';

function App() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [blockchainConnected, setBlockchainConnected] = useState(false);
  const [consensusInfo, setConsensusInfo] = useState(null);
  const [lastConsensusResult, setLastConsensusResult] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [toast, setToast] = useState(null);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load data on startup
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await checkConnection();
  };

  const checkConnection = async () => {
    try {
      console.log('🔗 Checking blockchain connection...');
      const [cropsResult, consensusResult] = await Promise.all([
        BlockchainService.getAllCrops(),
        BlockchainService.getConsensusInfo()
      ]);
      
      console.log('✅ Connection successful, crops received:', cropsResult);
      
      setBlockchainConnected(true);
      setCrops(Array.isArray(cropsResult) ? cropsResult : []);
      setConsensusInfo(consensusResult);
      setLastUpdate(new Date());
      showToast('Connected to blockchain successfully!', 'success');
    } catch (err) {
      console.error('Connection error:', err);
      setBlockchainConnected(false);
      setError('Blockchain not connected. Start REST server on port 3000.');
    }
  };

  const loadCrops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading crops from blockchain...');
      const result = await BlockchainService.getAllCrops();
      console.log('📦 Loaded crops result:', result);
      
      const cropsArray = Array.isArray(result) ? result : [];
      setCrops(cropsArray);
      setLastUpdate(new Date());
      setError('');
      
      console.log(`✅ Successfully loaded ${cropsArray.length} crops`);
      console.log(`📊 Available: ${cropsArray.filter(c => c.status === 'available').length}, Sold: ${cropsArray.filter(c => c.status === 'sold').length}`);
      return cropsArray;
    } catch (err) {
      console.error('Load crops error:', err);
      setError('Failed to load crops: ' + err.message);
      setCrops([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get fresh data directly from blockchain (bypasses state)
  const getFreshCropData = async (cropId) => {
    try {
      const allCrops = await BlockchainService.getAllCrops();
      return allCrops.find(c => c.id === cropId);
    } catch (error) {
      console.error('Error getting fresh crop data:', error);
      return null;
    }
  };

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const cropData = {
      id: `crop-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: formData.get('name'),
      type: formData.get('type'),
      quantity: parseInt(formData.get('quantity')),
      price: parseFloat(formData.get('price')),
      farmer: formData.get('farmer'),
      location: formData.get('location'),
      plantedDate: formData.get('plantedDate'),
      harvestDate: formData.get('harvestDate'),
      quality: formData.get('quality'),
      description: formData.get('description'),
      timestamp: new Date().toISOString()
    };

    console.log('🌱 Creating crop:', cropData);

    try {
      setLoading(true);
      await BlockchainService.createCrop(cropData);
      
      console.log('✅ Crop created successfully');
      showToast(`Crop "${cropData.name}" created successfully!`, 'success');
      
      // Wait and refresh
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadCrops();
      
      e.target.reset();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Create crop error:', err);
      const errorMsg = 'Failed to create crop: ' + err.message;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (crop) => {
    try {
      setLoading(true);
      
      // ALWAYS get fresh data from blockchain first
      console.log('🔄 Getting latest crop status from blockchain...');
      const freshCrop = await getFreshCropData(crop.id);
      
      if (!freshCrop) {
        showToast('❌ Crop not found in blockchain!', 'error');
        return;
      }

      // Check if crop is already sold
      if (freshCrop.status === 'sold') {
        const buyerInfo = freshCrop.buyer ? ` to ${freshCrop.buyer}` : '';
        showToast(`❌ ${freshCrop.name} is already sold${buyerInfo}!`, 'error');
        
        // Update UI immediately to reflect blockchain state
        setCrops(prevCrops => 
          prevCrops.map(c => 
            c.id === crop.id ? { ...c, status: 'sold', buyer: freshCrop.buyer } : c
          )
        );
        return;
      }

      const buyer = prompt(`Enter your name to purchase ${freshCrop.name}:`);
      if (buyer && buyer.trim()) {
        const totalValue = freshCrop.quantity * freshCrop.price;
        console.log(`🛒 Purchasing ${freshCrop.name} for ${buyer}, Total: $${totalValue}`);
        
        // Check if consensus is required
        const requiresConsensus = freshCrop.quality === 'premium' || freshCrop.quality === 'organic' || totalValue > 5000;
        
        if (requiresConsensus) {
          // Use PurchaseCropWithConsensus for premium/high-value crops
          const confirmPurchase = window.confirm(
            `🔐 This ${freshCrop.quality} crop requires hybrid consensus validation (Value: $${totalValue}). Continue with purchase?`
          );
          
          if (!confirmPurchase) {
            setLoading(false);
            return;
          }
          
          await BlockchainService.purchaseCropWithConsensus(freshCrop.id, buyer.trim(), totalValue);
          showToast(`🔐 ${freshCrop.name} purchased with consensus validation!`, 'success');
        } else {
          // Use regular PurchaseCrop for standard crops
          await BlockchainService.purchaseCrop(freshCrop.id, buyer.trim());
          showToast(`✅ ${freshCrop.name} purchased successfully!`, 'success');
        }
        
        console.log('✅ Purchase completed');
        
        // Wait for blockchain confirmation
        showToast('⏳ Processing transaction on blockchain...', 'info');
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Refresh ALL data to get updated status
        console.log('🔄 Refreshing all data after purchase...');
        await loadCrops();
        
        showToast(`🎉 Successfully purchased ${freshCrop.name}!`, 'success');
      }
      
    } catch (err) {
      console.error('Purchase error:', err);
      
      let errorMsg = 'Purchase failed: ';
      
      if (err.message.includes('already sold')) {
        errorMsg = `❌ This crop was just sold to someone else!`;
        // Immediately refresh to show correct status
        await loadCrops();
      } else if (err.message.includes('500')) {
        errorMsg = 'Purchase failed: Please refresh and try again.';
      } else {
        errorMsg += err.message;
      }
      
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateConsensus = async () => {
    try {
      setLoading(true);
      const result = await BlockchainService.validateHybridConsensus('SYSTEM_CHECK');
      setLastConsensusResult(result);
      
      if (result.valid) {
        showToast('✅ Consensus system is OPERATIONAL!', 'success');
      } else {
        showToast('⚠️ Consensus system has issues', 'warning');
      }
    } catch (err) {
      const errorMsg = 'Failed to validate consensus: ' + err.message;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics based on CURRENT blockchain state
  const totalCrops = crops.length;
  const availableCrops = crops.filter(crop => crop.status === 'available').length;
  const soldCrops = crops.filter(crop => crop.status === 'sold').length;
  const premiumCrops = crops.filter(crop => crop.quality === 'premium' && crop.status === 'available').length;
  const organicCrops = crops.filter(crop => crop.quality === 'organic' && crop.status === 'available').length;
  const totalValue = crops.reduce((sum, crop) => sum + (crop.quantity * crop.price), 0);
  const availableValue = crops
    .filter(crop => crop.status === 'available')
    .reduce((sum, crop) => sum + (crop.quantity * crop.price), 0);

  // Get 8 most recent crops
  const recentCrops = [...crops]
    .sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return b.id.localeCompare(a.id);
    })
    .slice(0, 8);

  const Dashboard = () => (
    <div className="dashboard">
      <h2>🌾 AgriBankChain Dashboard</h2>
      
      <div className={`connection ${blockchainConnected ? 'connected' : 'disconnected'}`}>
        {blockchainConnected ? '🟢 Connected to Blockchain' : '🔴 Blockchain Not Connected'}
        <div>
          {totalCrops} total crops • {availableCrops} available • {soldCrops} sold
          {lastUpdate && (
            <span className="update-time">
              (Updated: {lastUpdate.toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <h3>Total Crops</h3>
          <p>{totalCrops}</p>
        </div>
        <div className="stat">
          <h3>Available</h3>
          <p>{availableCrops}</p>
        </div>
        <div className="stat">
          <h3>Sold</h3>
          <p>{soldCrops}</p>
        </div>
        <div className="stat">
          <h3>Premium</h3>
          <p>{premiumCrops}</p>
        </div>
        <div className="stat">
          <h3>Organic</h3>
          <p>{organicCrops}</p>
        </div>
        <div className="stat">
          <h3>Total Value</h3>
          <p>${totalValue.toLocaleString()}</p>
        </div>
        <div className="stat">
          <h3>Available Value</h3>
          <p>${availableValue.toLocaleString()}</p>
        </div>
        <div className="stat">
          <h3>Last Update</h3>
          <p>{lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</p>
        </div>
      </div>

      <div className="recent">
        <h3>🆕 Recent Activity (Latest 8 of {totalCrops} total)</h3>
        {recentCrops.length === 0 ? (
          <div className="empty-state">
            <p>No crops registered yet</p>
            <button onClick={() => setActiveTab('create')}>Register First Crop</button>
          </div>
        ) : (
          <div className="crops-list">
            {recentCrops.map((crop, index) => (
              <div key={crop.id || index} className={`crop-item ${crop.status === 'sold' ? 'sold' : ''}`}>
                <div className="crop-info">
                  <strong>{crop.name}</strong>
                  <span>by {crop.farmer} • {crop.quality} • {crop.location}</span>
                  {crop.buyer && <small>Buyer: {crop.buyer}</small>}
                </div>
                <div className="crop-meta">
                  <span>{crop.quantity} kg</span>
                  <span>${crop.price}/kg</span>
                  <span className={`status ${crop.status}`}>
                    {crop.status ? crop.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="actions">
        <button onClick={() => setActiveTab('create')}>➕ Register New Crop</button>
        <button onClick={() => setActiveTab('market')}>🛒 View Marketplace ({availableCrops})</button>
        <button onClick={() => setActiveTab('consensus')}>⚡ Check Consensus</button>
        <button onClick={loadCrops} disabled={loading}>
          {loading ? '🔄 Refreshing...' : '🔄 Refresh Blockchain Data'}
        </button>
      </div>
    </div>
  );

  const Marketplace = () => {
    // Filter based on CURRENT blockchain state
    const availableCropsList = crops.filter(crop => crop.status === 'available');
    const soldCropsList = crops.filter(crop => crop.status === 'sold');
    
    return (
      <div className="marketplace">
        <h2>🛒 Crop Marketplace</h2>
        <p>
          Real-time blockchain data • {availableCropsList.length} available • {soldCropsList.length} sold
          {lastUpdate && ` • Updated: ${lastUpdate.toLocaleTimeString()}`}
        </p>
        
        <div className="marketplace-stats">
          <div className="market-stat available">
            <strong>Available:</strong> {availableCropsList.length}
          </div>
          <div className="market-stat sold">
            <strong>Sold:</strong> {soldCropsList.length}
          </div>
        </div>
        
        <div className="manual-refresh-section">
          <button onClick={loadCrops} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh from Blockchain'}
          </button>
          <small>Shows real blockchain state - not cached data</small>
        </div>
        
        {loading ? (
          <div className="loading">Loading latest blockchain data...</div>
        ) : availableCropsList.length === 0 ? (
          <div className="empty-state">
            <p>🌱 No crops available for purchase</p>
            <p>All {totalCrops} crops in the system have been sold</p>
            <button onClick={() => setActiveTab('create')}>Register New Crop</button>
          </div>
        ) : (
          <div className="crops-grid">
            {availableCropsList.map((crop, index) => {
              const totalValue = crop.quantity * crop.price;
              const requiresConsensus = crop.quality === 'premium' || crop.quality === 'organic' || totalValue > 5000;
              
              return (
                <div key={crop.id || index} className="crop-card">
                  <div className="crop-header">
                    <h3>{crop.name}</h3>
                    <div>
                      <span className="crop-type">{crop.type}</span>
                      {requiresConsensus && <span className="consensus-required">🔐 CONSENSUS</span>}
                    </div>
                  </div>
                  
                  <div className="crop-details">
                    <div className="detail">
                      <span className="label">Farmer:</span>
                      <span className="value">{crop.farmer}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Location:</span>
                      <span className="value">{crop.location}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Quantity:</span>
                      <span className="value">{crop.quantity} kg</span>
                    </div>
                    <div className="detail">
                      <span className="label">Price:</span>
                      <span className="value price">${crop.price}/kg</span>
                    </div>
                    <div className="detail">
                      <span className="label">Quality:</span>
                      <span className={`value quality ${crop.quality}`}>
                        {crop.quality.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail">
                      <span className="label">Total Value:</span>
                      <span className="value">${totalValue.toLocaleString()}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Blockchain Status:</span>
                      <span className={`value status-indicator ${crop.status}`}>
                        {crop.status.toUpperCase()}
                      </span>
                    </div>
                    {requiresConsensus && (
                      <div className="detail">
                        <span className="label">Validation:</span>
                        <span className="value consensus-warning">HYBRID CONSENSUS</span>
                      </div>
                    )}
                    {crop.description && (
                      <div className="detail full-width">
                        <span className="label">Description:</span>
                        <span className="value">{crop.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="crop-footer">
                    <div className={`status ${crop.status}`}>
                      {crop.status.toUpperCase()}
                    </div>
                    <button 
                      onClick={() => handlePurchase(crop)}
                      disabled={loading}
                      className="purchase-btn"
                    >
                      {loading ? 'Processing...' : 'Purchase'}
                    </button>
                  </div>
                  
                  {requiresConsensus && (
                    <div className="consensus-notice">
                      <small>
                        🛡️ This {crop.quality} crop requires hybrid consensus validation 
                        ({totalValue > 5000 ? 'High Value' : 'Premium Quality'})
                      </small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Show recently sold crops */}
        {soldCropsList.length > 0 && (
          <div className="sold-crops-section">
            <h3>✅ Recently Sold Crops ({soldCropsList.length} total)</h3>
            <div className="sold-crops-list">
              {soldCropsList.slice(0, 8).map((crop, index) => (
                <div key={`sold-${crop.id}`} className="sold-crop-item">
                  <span className="sold-crop-name">{crop.name}</span>
                  <span className="sold-to">→ Sold to {crop.buyer || 'Unknown Buyer'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const CreateCrop = () => (
    <div className="create">
      <h2>➕ Register New Crop</h2>
      <p>Register a new crop on the blockchain</p>
      
      <form onSubmit={handleCreateCrop}>
        <input 
          name="name" 
          placeholder="Crop Name" 
          required 
          disabled={loading}
        />
        <select name="type" required disabled={loading}>
          <option value="">Select Type</option>
          <option value="rice">Rice</option>
          <option value="wheat">Wheat</option>
          <option value="vegetable">Vegetable</option>
          <option value="fruit">Fruit</option>
          <option value="spice">Spice</option>
        </select>
        
        <div className="form-row">
          <input 
            name="quantity" 
            type="number" 
            placeholder="Quantity (kg)" 
            required 
            disabled={loading}
          />
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            placeholder="Price per kg" 
            required 
            disabled={loading}
          />
        </div>
        
        <input 
          name="farmer" 
          placeholder="Farmer Name" 
          required 
          disabled={loading}
        />
        <input 
          name="location" 
          placeholder="Location" 
          required 
          disabled={loading}
        />
        
        <div className="form-row">
          <input 
            name="plantedDate" 
            type="date" 
            required 
            disabled={loading}
          />
          <input 
            name="harvestDate" 
            type="date" 
            required 
            disabled={loading}
          />
        </div>
        
        <select name="quality" required disabled={loading}>
          <option value="">Select Quality</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="organic">Organic</option>
        </select>
        
        <textarea 
          name="description" 
          placeholder="Crop Description" 
          required 
          disabled={loading}
        ></textarea>
        
        <button type="submit" disabled={loading || !blockchainConnected}>
          {loading ? 'Creating on Blockchain...' : 'Register on Blockchain'}
        </button>
      </form>

      <div className="manual-refresh-section">
        <p>Need latest data? Refresh from blockchain:</p>
        <button onClick={loadCrops} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Blockchain Data'}
        </button>
      </div>
    </div>
  );

  const Consensus = () => (
  <div className="consensus">
    <h2>⚡ Hybrid Consensus System</h2>
    
    <div className="consensus-info">
      <h3>Real Validator-Based Transaction Validation</h3>
      <p>High-value and premium crop purchases require multi-organization consensus</p>
      
      {/* Add the real consensus simulation */}
      <RealConsensusInfo />
      
      <div className="current-simulation">
        <h4>🎯 Current Chaincode Simulation</h4>
        <p>Your deployed chaincode currently uses simulated consensus with these rules:</p>
        
        <button 
          onClick={handleValidateConsensus}
          disabled={loading}
          className="validate-btn"
        >
          {loading ? 'Validating...' : 'Test Current Consensus'}
        </button>

        {lastConsensusResult && (
          <div className="consensus-result">
            <h4>🔬 Current Simulation Result:</h4>
            <div className={`consensus-status ${lastConsensusResult.valid ? 'valid' : 'invalid'}`}>
              <p><strong>System Status:</strong> {lastConsensusResult.valid ? '✅ OPERATIONAL' : '❌ DEGRADED'}</p>
              <p><strong>PoA Approvals:</strong> {lastConsensusResult.poaApprovals || lastConsensusResult.PoAApprovals || 0}/3 Banks & Government</p>
              <p><strong>DPoS Stake:</strong> {lastConsensusResult.dposStake || lastConsensusResult.DPoSStake || 0}/3600 Stakeholders</p>
              <p><strong>PBFT Nodes:</strong> {lastConsensusResult.totalNodes || lastConsensusResult.TotalNodes || 0}/7 Network Nodes</p>
              <p><strong>Message:</strong> {lastConsensusResult.message || lastConsensusResult.Message || 'System ready'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

  return (
    <div className="App">
      <header>
        <h1>AgriBankChain</h1>
        <p>Secure Agricultural Marketplace with Real-time Blockchain Data</p>
      </header>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <nav>
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}>
          Marketplace ({availableCrops})
        </button>
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>
          Register Crop
        </button>
        <button className={activeTab === 'consensus' ? 'active' : ''} onClick={() => setActiveTab('consensus')}>
          Consensus
        </button>
        
        <button onClick={loadCrops} disabled={loading} className="global-refresh">
          {loading ? '🔄...' : '🔄 Refresh Blockchain'}
        </button>
      </nav>

      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'market' && <Marketplace />}
        {activeTab === 'create' && <CreateCrop />}
        {activeTab === 'consensus' && <Consensus />}
      </main>
    </div>
  );
}
// Add this component to your App.js (no chaincode changes needed)
const RealConsensusInfo = () => {
  const [simulatedApprovals, setSimulatedApprovals] = useState([]);
  
  const poaValidators = [
    { mspId: "BankMSP", role: "bank", orgName: "Reserve Bank", stake: 0, approved: false },
    { mspId: "GovernmentMSP", role: "government", orgName: "Agriculture Ministry", stake: 0, approved: false },
    { mspId: "BankMSP2", role: "bank", orgName: "Cooperative Bank", stake: 0, approved: false },
  ];

  const dposValidators = [
    { mspId: "FarmerCoop1MSP", role: "farmer", orgName: "Farmer Cooperative 1", stake: 1000, approved: false },
    { mspId: "FarmerCoop2MSP", role: "farmer", orgName: "Farmer Cooperative 2", stake: 800, approved: false },
    { mspId: "BuyerConsortiumMSP", role: "buyer", orgName: "Buyer Consortium", stake: 1200, approved: false },
    { mspId: "ProcessorMSP", role: "processor", orgName: "Food Processor", stake: 600, approved: false },
  ];

  const simulateValidatorApproval = (validatorMSP) => {
    setSimulatedApprovals(prev => {
      if (prev.includes(validatorMSP)) {
        return prev.filter(msp => msp !== validatorMSP);
      } else {
        return [...prev, validatorMSP];
      }
    });
  };

  // Calculate consensus status based on simulated approvals
  const calculateConsensusStatus = () => {
    const poaApproved = poaValidators.filter(v => simulatedApprovals.includes(v.mspId)).length;
    const dposStake = dposValidators
      .filter(v => simulatedApprovals.includes(v.mspId))
      .reduce((sum, v) => sum + v.stake, 0);
    
    const totalStake = 3600;
    const totalNodes = 7;
    const participatingNodes = simulatedApprovals.length;

    const poaValid = poaApproved >= 2; // 2/3 PoA validators
    const dposValid = dposStake >= totalStake / 2; // 51% stake
    const pbftValid = participatingNodes >= 5; // n - f nodes

    return {
      valid: poaValid && dposValid && pbftValid,
      poaApprovals: poaApproved,
      dposStake: dposStake,
      totalNodes: participatingNodes,
      message: poaValid && dposValid && pbftValid 
        ? "✅ Consensus Achieved! Transaction can proceed."
        : `⏳ Consensus Pending: PoA ${poaApproved}/3, DPoS ${dposStake}/${totalStake} stake, PBFT ${participatingNodes}/${totalNodes} nodes`
    };
  };

  const consensusStatus = calculateConsensusStatus();

  return (
    <div className="real-consensus-info">
      <h3>🔐 Real Consensus Mechanism </h3>
      <p>This shows how consensus would work with real validators in production</p>
      
      <div className="consensus-types">
        <div className="consensus-type">
          <h4>🏛️ Proof of Authority (PoA) Validators</h4>
          <p>Banks & Government - 2/3 approval required</p>
          <div className="validators-list">
            {poaValidators.map((validator, index) => (
              <div key={index} className="validator-item">
                <span className="validator-org">{validator.orgName}</span>
                <span className="validator-role">{validator.role}</span>
                <button 
                  onClick={() => simulateValidatorApproval(validator.mspId)}
                  className={`approve-btn ${simulatedApprovals.includes(validator.mspId) ? 'approved' : ''}`}
                >
                  {simulatedApprovals.includes(validator.mspId) ? '✅ Approved' : '⏳ Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="consensus-type">
          <h4>👥 Delegated Proof of Stake (DPoS) Validators</h4>
          <p>Stake-based voting - 51% stake (1800/3600) required</p>
          <div className="validators-list">
            {dposValidators.map((validator, index) => (
              <div key={index} className="validator-item">
                <span className="validator-org">{validator.orgName}</span>
                <span className="validator-stake">Stake: {validator.stake}</span>
                <button 
                  onClick={() => simulateValidatorApproval(validator.mspId)}
                  className={`approve-btn ${simulatedApprovals.includes(validator.mspId) ? 'approved' : ''}`}
                >
                  {simulatedApprovals.includes(validator.mspId) ? '✅ Approved' : '⏳ Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="consensus-status-real">
        <h4>📊 Current Consensus Status</h4>
        <div className={`status-box ${consensusStatus.valid ? 'consensus-achieved' : 'consensus-pending'}`}>
          <p><strong>PoA Approvals:</strong> {consensusStatus.poaApprovals}/3 Banks & Government</p>
          <p><strong>DPoS Stake:</strong> {consensusStatus.dposStake}/3600 ({(consensusStatus.dposStake/3600*100).toFixed(1)}%)</p>
          <p><strong>PBFT Participation:</strong> {consensusStatus.totalNodes}/7 Nodes</p>
          <p><strong>Overall Status:</strong> {consensusStatus.valid ? '✅ CONSENSUS ACHIEVED' : '⏳ CONSENSUS PENDING'}</p>
          <p><strong>Message:</strong> {consensusStatus.message}</p>
        </div>
      </div>

      <div className="consensus-explanation">
        <h4>🚀 How This Works in Production</h4>
        <div className="explanation-grid">
          <div className="explanation-item">
            <h5>🏛️ PoA Validators</h5>
            <p>Pre-approved organizations (banks, government) that must approve high-value transactions</p>
          </div>
          <div className="explanation-item">
            <h5>👥 DPoS Stakeholders</h5>
            <p>Farmer cooperatives, buyers, processors with voting power based on their stake</p>
          </div>
          <div className="explanation-item">
            <h5>🛡️ PBFT Network</h5>
            <p>Byzantine fault tolerance ensuring network reliability even if some nodes fail</p>
          </div>
          <div className="explanation-item">
            <h5>✅ All Must Agree</h5>
            <p>All three consensus mechanisms must pass for high-value transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;