# AgriBankChain - Agricultural Supply Chain on Blockchain

A secure blockchain-based agricultural marketplace built using Hyperledger Fabric.  
The system enables farmers, buyers, and financial institutions to interact in a trusted and transparent environment.

---

## Overview

AgriBankChain allows:

- Farmers to register and manage crops  
- Buyers to purchase agricultural produce  
- Banks to provide crop-backed loans  

All transactions are recorded on a blockchain to ensure transparency, security, and traceability.

---

## Key Features

- Hybrid consensus mechanism (PoA + DPoS + PBFT)  
- Crop registration and tracking  
- Secure crop purchasing system  
- Loan application with automated interest handling  
- Real-time blockchain state updates  
- Special validation for high-value transactions  

---

## Architecture
React Frontend (Port 3000)
↓
Express REST API Server
↓
Hyperledger Fabric Network
↓
Chaincode (Go)


---

## Consensus Mechanism

| Type | Participants | Rule | Purpose |
|------|-------------|------|---------|
| PoA  | 2 Banks + 1 Government | 2/3 approval | Regulatory validation |
| DPoS | Stakeholder groups | Majority stake | Community governance |
| PBFT | Network nodes | Fault tolerance | Network reliability |

**Used for:** Premium crops or transactions above $5000

---

## Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React 18, CSS |
| Backend | Node.js, Express |
| Blockchain | Hyperledger Fabric 2.5, Go |
| Infrastructure | Docker, Docker Compose |

---

## Prerequisites

- Node.js (v16+)  
- npm (v8+)  
- Docker Desktop (20.10+)  
- Go (1.19+)  
- Hyperledger Fabric (2.5+)  

---

## Setup Instructions

### 1. Clone Repository

git clone https://github.com/Nirupama-Shankar/agrichain-blockchain.git
cd agrichain-blockchain

### 2. Start Blockchain Network
cd network
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn agrichain -ccp ../chaincode -ccl go

### 3. Set Environment Variables
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

### 4. Start Backend Server
cd ../fullstack-app
node server.js

### 5. Start Frontend
cd ../frontend
npm install
npm start
Open: http://localhost:3000


### API Endpoints
| Method | Endpoint                                 | Description         |
| ------ | ---------------------------------------- | ------------------- |
| GET    | /health                                  | Server health check |
| POST   | /channels/mychannel/chaincodes/agrichain | Invoke chaincode    |

### Smart Contract Functions
| Function                  | Type   | Description              |
| ------------------------- | ------ | ------------------------ |
| GetAllCrops               | Query  | Fetch all crops          |
| CreateCrop                | Invoke | Register crop            |
| PurchaseCrop              | Invoke | Purchase crop            |
| PurchaseCropWithConsensus | Invoke | Purchase with validation |
| ApplyForLoan              | Invoke | Request loan             |
| GetLoansByFarmer          | Query  | Fetch loans              |

### Project Structure

agrichain-blockchain/

├── frontend/

├── fullstack-app/

├── network/

├── chaincode/

├── screenshots/

├── demo-video.mp4

└── start-rest-server.sh

### Troubleshooting
| Issue                  | Solution                                                          |
| ---------------------- | ----------------------------------------------------------------- |
| Port 3000 busy         | npx kill-port 3000                                                |
| Backend not responding | curl [http://localhost:3000/health](http://localhost:3000/health) |
| Chaincode fails        | Restart network                                                   |
| Data not updating      | Refresh UI                                                        |

### Demo
Demo video available in the repository
Screenshots available in /screenshots

### Contributing
Fork the repository
Create a new branch
Commit your changes
Push to your branch
Create a pull request

### License
This project is licensed under the MIT License.

### Author
Nirupama Shankar

### Acknowledgments
Hyperledger Fabric Community
React Team
