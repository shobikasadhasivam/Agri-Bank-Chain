import React, { useState, useEffect } from 'react';
import './App.css';
import BlockchainService from './services/blockchainService';
import { mockCrops, mockConsensusInfo, mockConsensusResult } from './services/mockDataService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [crops, setCrops] = useState([]);
  const [consensusInfo, setConsensusInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNetworkConnection();
    loadInitialData();
  }, []);

  const checkNetworkConnection = async () => {
    try {
      // Try to connect to blockchain
      setNetworkStatus('checking');
      // For now, we'll simulate connection
      setTimeout(() => setNetworkStatus('connected'), 1000);
    } catch (error) {
      setNetworkStatus('disconnected');
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Try to get real data from blockchain
      // const realCrops = await BlockchainService.getAllCrops();
      // setCrops(realCrops);
      
      // const realConsensusInfo = await BlockchainService.getConsensusInfo();
      // setConsensusInfo(realConsensusInfo);
      
      // For now, use mock data
      setCrops(mockCrops);
      setConsensusInfo(mockConsensusInfo);
    } catch (error) {
      console.log('Using mock data due to:', error.message);
      setCrops(mockCrops);
      setConsensusInfo(mockConsensusInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCrop = async (cropData) => {
    try {
      setLoading(true);
      if (cropData.price * cropData.quantity > 10000) {
        await BlockchainService.createHighValueCrop(cropData);
      } else {
        await BlockchainService.createCrop(cropData);
      }
      await loadInitialData(); // Refresh data
      alert('Crop created successfully!');
    } catch (error) {
      alert('Failed to create crop: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCrop = async (cropId, buyer, amount) => {
    try {
      setLoading(true);
      if (amount > 10000) {
        await BlockchainService.purchaseCropWithConsensus(cropId, buyer, amount);
      } else {
        await BlockchainService.purchaseCrop(cropId, buyer);
      }
      await loadInitialData(); // Refresh data
      alert('Purchase completed successfully!');
    } catch (error) {
      alert('Failed to purchase crop: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const Dashboard = () => (
    <div className="dashboard">
      <h1>🌱 AgriBankChain Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Crops</h3>
          <div className="stat-value">{crops.length}</div>
        </div>
        <div className="stat-card">
          <h3>Active Farmers</h3>
          <div className="stat-value">
            {new Set(crops.map(c => c.farmer)).size}
          </div>
        </div>
        <div className="stat-card">
          <h3>Available Crops</h3>
          <div className="stat-value">
            {crops.filter(c => c.status === 'available').length}
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <div className="stat-value">
            ${crops.reduce((sum, crop) => sum + (crop.price * crop.quantity), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="section">
          <h3>🚨 Recent Activity</h3>
          <div className="activity-list">
            {crops.slice(0, 4).map((crop, index) => (
              <div key={index} className="activity-item">
                {crop.status === 'sold' 
                  ? `💰 ${crop.farmer} sold ${crop.name}`
                  : `🌱 ${crop.farmer} registered ${crop.name}`
                }
                {crop.isHighValue && ' ⭐ HIGH-VALUE'}
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>📊 Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => {
                const newCrop = {
                  id: 'crop' + (crops.length + 1),
                  name: 'New Crop',
                  type: 'vegetable',
                  quantity: 100,
                  price: 2.0,
                  farmer: 'New Farmer',
                  location: 'Location',
                  plantedDate: '2024-01-01',
                  harvestDate: '2024-04-01',
                  quality: 'standard',
                  description: 'New crop description'
                };
                handleCreateCrop(newCrop);
              }}
            >
              Register New Crop
            </button>
            <button 
              className="action-btn"
              onClick={() => setActiveTab('marketplace')}
            >
              View Marketplace
            </button>
            <button 
              className="action-btn"
              onClick={() => setActiveTab('consensus')}
            >
              Check Consensus
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Marketplace = () => {
    const availableCrops = crops.filter(crop => crop.status === 'available');

    return (
      <div className="marketplace">
        <h1>🌾 Crop Marketplace</h1>
        
        <div className="filters">
          <select className="filter-select" defaultValue="">
            <option value="">All Crop Types</option>
            <option value="rice">Rice</option>
            <option value="wheat">Wheat</option>
            <option value="spice">Spices</option>
            <option value="vegetable">Vegetables</option>
          </select>
          <select className="filter-select" defaultValue="available">
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="all">All Status</option>
          </select>
        </div>

        <div className="crops-grid">
          {availableCrops.map(crop => (
            <div key={crop.id} className="crop-card">
              <div className="crop-header">
                <h3>{crop.name}</h3>
                {crop.isHighValue && <span className="high-value-badge">⭐ HIGH-VALUE</span>}
                <span className={`status-badge ${crop.status}`}>
                  {crop.status.toUpperCase()}
                </span>
              </div>
              
              <div className="crop-details">
                <p><strong>Type:</strong> {crop.type}</p>
                <p><strong>Quantity:</strong> {crop.quantity} kg</p>
                <p><strong>Price:</strong> ${crop.price}/kg</p>
                <p><strong>Total Value:</strong> ${(crop.quantity * crop.price).toLocaleString()}</p>
                <p><strong>Farmer:</strong> {crop.farmer}</p>
                <p><strong>Location:</strong> {crop.location}</p>
                <p><strong>Quality:</strong> <span className="quality-tag">{crop.quality}</span></p>
              </div>

              <button 
                className={`purchase-btn ${crop.isHighValue ? 'high-value' : ''}`}
                onClick={() => handlePurchaseCrop(crop.id, 'Buyer Corp', crop.price * crop.quantity)}
                disabled={loading}
              >
                {loading ? 'Processing...' : crop.isHighValue ? 'Purchase with Consensus' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {availableCrops.length === 0 && (
          <div className="no-crops">
            <p>No available crops at the moment.</p>
          </div>
        )}
      </div>
    );
  };

  const ConsensusMonitor = () => {
    const [consensusResult, setConsensusResult] = useState(null);

    const testConsensus = async () => {
      try {
        setLoading(true);
        // const result = await BlockchainService.validateHybridConsensus('TEST_OPERATION');
        // setConsensusResult(result);
        setConsensusResult(mockConsensusResult); // Using mock for now
      } catch (error) {
        console.error('Consensus test failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!consensusInfo) {
      return <div>Loading consensus information...</div>;
    }

    return (
      <div className="consensus">
        <h1>🔐 Hybrid Consensus Monitor</h1>
        
        <div className="consensus-overview">
          <div className="consensus-status">
            <div className={`status-indicator ${networkStatus}`}></div>
            <span>Consensus Network: {networkStatus.toUpperCase()}</span>
          </div>
          <p className="consensus-description">
            {consensusInfo.description}
          </p>
        </div>

        <div className="consensus-grid">
          <div className="consensus-section">
            <h3>🏦 Proof of Authority (PoA)</h3>
            <p className="section-description">Bank & Government Validators</p>
            {consensusInfo.poaValidators.map((validator, index) => (
              <div key={index} className="validator-item">
                <span className="validator-name">{validator.orgName}</span>
                <span className="validator-role">({validator.role})</span>
              </div>
            ))}
            <div className="validation-summary">
              PoA Validators: {consensusInfo.poaValidators.length} Registered
            </div>
          </div>

          <div className="consensus-section">
            <h3>👨‍🌾 Delegated Proof of Stake (DPoS)</h3>
            <p className="section-description">Farmer & Stakeholder Voting</p>
            {consensusInfo.dposValidators.map((validator, index) => (
              <div key={index} className="stakeholder-item">
                <span className="stakeholder-name">{validator.orgName}</span>
                <span className="stake-amount">{validator.stake} Stake</span>
              </div>
            ))}
            <div className="stake-summary">
              <div>Total Stake: {consensusInfo.dposValidators.reduce((sum, v) => sum + v.stake, 0)}</div>
              <div>Minimum Required: 51% for approval</div>
            </div>
          </div>

          <div className="consensus-section">
            <h3>🛡️ Practical Byzantine Fault Tolerance (PBFT)</h3>
            <p className="section-description">Network Reliability</p>
            <div className="pbft-info">
              <div className="pbft-stat">
                <span>Total Nodes:</span>
                <span>{consensusInfo.pbftConfig.totalNodes}</span>
              </div>
              <div className="pbft-stat">
                <span>Fault Tolerance:</span>
                <span>{consensusInfo.pbftConfig.faultyNodes} nodes</span>
              </div>
              <div className="pbft-stat">
                <span>Status:</span>
                <span>{consensusInfo.pbftConfig.faultTolerance}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="consensus-test">
          <h3>🧪 Test Consensus Validation</h3>
          <button 
            className="consensus-btn" 
            onClick={testConsensus}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Hybrid Consensus'}
          </button>
          
          {consensusResult && (
            <div className={`consensus-result ${consensusResult.valid ? 'valid' : 'invalid'}`}>
              <h4>Consensus Result:</h4>
              <p>{consensusResult.message}</p>
              <div className="result-details">
                <div>PoA Approvals: {consensusResult.poaApprovals}/3</div>
                <div>DPoS Stake: {consensusResult.dposStake}/3600</div>
                <div>Nodes Participating: {consensusResult.totalNodes}/7</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BankingHub = () => (
    <div className="banking">
      <h1>🏦 Banking & Financial Services</h1>
      <div className="banking-grid">
        <div className="service-card">
          <h3>💸 Make Payment</h3>
          <p>Secure transactions with hybrid consensus</p>
          <button className="service-btn">Start Payment</button>
        </div>
        <div className="service-card">
          <h3>📜 Transaction History</h3>
          <p>View complete audit trail</p>
          <button className="service-btn">View History</button>
        </div>
        <div className="service-card">
          <h3>🏦 Crop Loans</h3>
          <p>Apply for agricultural financing</p>
          <button className="service-btn">Apply Now</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🌱 AgriBankChain</h1>
          <div className="network-status">
            <div className={`status-dot ${networkStatus}`}></div>
            <span>Network: {networkStatus.toUpperCase()}</span>
            {loading && <span className="loading-spinner">🔄</span>}
          </div>
        </div>
        
        <nav className="main-nav">
          {[
            { id: 'dashboard', label: '🏠 Dashboard' },
            { id: 'marketplace', label: '🌱 Marketplace' },
            { id: 'banking', label: '🏦 Banking' },
            { id: 'consensus', label: '🔐 Consensus' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'marketplace' && <Marketplace />}
        {activeTab === 'banking' && <BankingHub />}
        { activeTab === 'consensus' && <ConsensusMonitor />}
      </main>

      <footer className="app-footer">
        <p>AgriBankChain - Hybrid Consensus Blockchain for Agriculture</p>
        <p>PoA + PBFT + DPoS | Secure • Transparent • Efficient</p>
      </footer>
    </div>
  );
}

export default App;
