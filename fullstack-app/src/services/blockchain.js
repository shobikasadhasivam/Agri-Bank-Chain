class BlockchainService {
  static baseURL = 'http://localhost:3000';

  static async callBlockchain(fcn, args = []) {
    try {
      console.log(`📞 Calling blockchain: ${fcn}`, args);
      
      const response = await fetch(`${this.baseURL}/channels/mychannel/chaincodes/agrichain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fcn, args }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      console.log(`📦 Raw response for ${fcn}:`, result);
      
      // Handle different response formats
      if (result.response) {
        try {
          return JSON.parse(result.response);
        } catch (e) {
          return result.response;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Blockchain call failed for ${fcn}:`, error);
      throw new Error(`Blockchain call failed: ${error.message}`);
    }
  }

  static async getAllCrops() {
    try {
      const result = await this.callBlockchain('GetAllCrops');
      console.log('🌾 getAllCrops raw result:', result);
      
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === 'object') {
        return [result];
      } else {
        console.warn('Unexpected response format:', result);
        return [];
      }
    } catch (error) {
      console.error('Failed to get crops:', error);
      return [];
    }
  }

  static async createCrop(cropData) {
    const args = [
      cropData.id,
      cropData.name,
      cropData.type,
      cropData.quantity.toString(),
      cropData.price.toString(),
      cropData.farmer,
      cropData.location,
      cropData.plantedDate,
      cropData.harvestDate,
      cropData.quality,
      cropData.description
    ];
    console.log('🌱 Creating crop with args:', args);
    return await this.callBlockchain('CreateCrop', args);
  }

  static async purchaseCrop(cropId, buyer) {
    const args = [cropId, buyer];
    console.log('🛒 Purchasing crop:', args);
    return await this.callBlockchain('PurchaseCrop', args);
  }

  static async purchaseCropWithConsensus(cropId, buyer, amount, poaApprovals, dposStake, participatingNodes) {
    const args = [cropId, buyer, amount.toString()];
    console.log('🛒 Purchasing crop with consensus:', args);
    
    // First validate consensus with real parameters
    const consensusResult = await this.validateHybridConsensus('HIGH_VALUE_PURCHASE', poaApprovals, dposStake, participatingNodes);
    
    if (!consensusResult.valid) {
      throw new Error(`Consensus validation failed: ${consensusResult.message}`);
    }
    
    // If consensus passed, proceed with purchase
    return await this.callBlockchain('PurchaseCropWithConsensus', args);
  }

  // UPDATED: Now accepts real consensus parameters
  static async validateHybridConsensus(operation, poaApprovals, dposStake, participatingNodes) {
    const args = [
      operation, 
      poaApprovals.toString(), 
      dposStake.toString(), 
      participatingNodes.toString()
    ];
    console.log('🔐 Validating consensus with real parameters:', args);
    return await this.callBlockchain('ValidateHybridConsensus', args);
  }

  static async getConsensusInfo() {
    return await this.callBlockchain('GetConsensusInfo');
  }

  // Quick connection check
  static async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default BlockchainService;