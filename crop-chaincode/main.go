package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// CropChaincode implements the fabric-contract-api-go programming model
type CropChaincode struct {
	contractapi.Contract
}

// Crop struct
type Crop struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Farmer string `json:"farmer"`
}

// InitLedger adds some sample crops to the ledger
func (c *CropChaincode) InitLedger(ctx contractapi.TransactionContextInterface) error {
	crops := []Crop{
		{ID: "1", Name: "Wheat", Farmer: "Alice"},
		{ID: "2", Name: "Rice", Farmer: "Bob"},
	}

	for _, crop := range crops {
		cropJSON, err := json.Marshal(crop)
		if err != nil {
			return err
		}
		err = ctx.GetStub().PutState(crop.ID, cropJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state: %v", err)
		}
	}
	return nil
}

// CreateCrop adds a new crop to the ledger
func (c *CropChaincode) CreateCrop(ctx contractapi.TransactionContextInterface, id string, name string, farmer string) error {
	crop := Crop{ID: id, Name: name, Farmer: farmer}
	cropJSON, err := json.Marshal(crop)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(id, cropJSON)
}

// QueryCrop retrieves a crop from the ledger
func (c *CropChaincode) QueryCrop(ctx contractapi.TransactionContextInterface, id string) (*Crop, error) {
	cropJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if cropJSON == nil {
		return nil, fmt.Errorf("the crop %s does not exist", id)
	}
	var crop Crop
	err = json.Unmarshal(cropJSON, &crop)
	if err != nil {
		return nil, err
	}
	return &crop, nil
}

// GetAllCrops returns all crops in the ledger
func (c *CropChaincode) GetAllCrops(ctx contractapi.TransactionContextInterface) ([]*Crop, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var crops []*Crop
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var crop Crop
		err = json.Unmarshal(queryResponse.Value, &crop)
		if err != nil {
			return nil, err
		}
		crops = append(crops, &crop)
	}
	return crops, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&CropChaincode{})
	if err != nil {
		fmt.Printf("Error create crop chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting crop chaincode: %s", err.Error())
	}
}

