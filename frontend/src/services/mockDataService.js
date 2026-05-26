// Mock data for development and demonstration
export const mockCrops = [
  {
    id: 'crop1',
    name: 'Basmati Rice',
    type: 'rice',
    quantity: 1000,
    price: 2.5,
    farmer: 'Farmer John',
    buyer: '',
    status: 'available',
    location: 'Punjab',
    plantedDate: '2024-01-15',
    harvestDate: '2024-04-20',
    quality: 'premium',
    description: 'Organic basmati rice'
  },
  {
    id: 'crop2',
    name: 'Wheat',
    type: 'wheat',
    quantity: 2000,
    price: 1.8,
    farmer: 'Farmer Singh',
    buyer: '',
    status: 'available',
    location: 'Haryana',
    plantedDate: '2024-02-01',
    harvestDate: '2024-05-10',
    quality: 'standard',
    description: 'High-quality wheat'
  },
  {
    id: 'crop3',
    name: 'Tomatoes',
    type: 'vegetable',
    quantity: 500,
    price: 3.2,
    farmer: 'Farmer Gupta',
    buyer: '',
    status: 'harvested',
    location: 'Maharashtra',
    plantedDate: '2024-03-10',
    harvestDate: '2024-06-15',
    quality: 'organic',
    description: 'Fresh organic tomatoes'
  },
  {
    id: 'crop7',
    name: 'Premium Saffron',
    type: 'spice',
    quantity: 5,
    price: 500,
    farmer: 'Farmer Khan',
    buyer: '',
    status: 'available',
    location: 'Kashmir',
    plantedDate: '2024-02-15',
    harvestDate: '2024-10-20',
    quality: 'premium',
    description: 'Worlds finest saffron',
    isHighValue: true
  }
];

export const mockConsensusInfo = {
  consensusModel: "Hybrid PoA+PBFT+DPoS",
  description: "Combines Proof of Authority for banks/government, Practical Byzantine Fault Tolerance for reliability, and Delegated Proof of Stake for farmer participation",
  poaValidators: [
    { mspId: "BankMSP", role: "bank", orgName: "Reserve Bank" },
    { mspId: "GovernmentMSP", role: "government", orgName: "Agriculture Ministry" },
    { mspId: "BankMSP2", role: "bank", orgName: "Cooperative Bank" }
  ],
  dposValidators: [
    { mspId: "FarmerCoop1MSP", stake: 1000, orgName: "Farmer Cooperative 1" },
    { mspId: "FarmerCoop2MSP", stake: 800, orgName: "Farmer Cooperative 2" },
    { mspId: "BuyerConsortiumMSP", stake: 1200, orgName: "Buyer Consortium" },
    { mspId: "ProcessorMSP", stake: 600, orgName: "Food Processor" }
  ],
  pbftConfig: {
    totalNodes: 7,
    faultyNodes: 2,
    faultTolerance: "Can tolerate up to 2 faulty nodes (n >= 3f+1)"
  }
};

export const mockConsensusResult = {
  valid: true,
  poaApprovals: 2,
  dposStake: 2800,
  totalNodes: 5,
  message: "Hybrid consensus passed: PoA=2/3, DPoS=2800/3600 stake, PBFT=5/7 nodes"
};
