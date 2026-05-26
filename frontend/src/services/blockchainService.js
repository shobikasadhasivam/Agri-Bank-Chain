// Blockchain connection service for AgriBankChain
const BASE_URL = 'http://localhost:3001/api';

class BlockchainService {
  async healthCheck() {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      throw new Error('Backend server is not available');
    }
  }

  async getAllCrops() {
    try {
      const response = await fetch(`${BASE_URL}/crops`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error('Failed to fetch crops: ' + error.message);
    }
  }

  async createCrop(cropData) {
    try {
      const response = await fetch(`${BASE_URL}/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cropData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to create crop: ' + error.message);
    }
  }

  async getConsensusInfo() {
    try {
      const response = await fetch(`${BASE_URL}/consensus/info`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      throw new Error('Failed to fetch consensus info: ' + error.message);
    }
  }

  async initLedger() {
    try {
      const response = await fetch(`${BASE_URL}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return await response.json();
    } catch (error) {
      throw new Error('Failed to initialize ledger: ' + error.message);
    }
  }
}

export default new BlockchainService();
