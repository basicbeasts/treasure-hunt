import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FUSD from "../../contracts/FUSD.cdc"
import BlackMarketplace from "../../contracts/BlackMarketplace.cdc"
import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"

// This script returns the available chest sales
pub fun main() : {Address:{UInt64: UFix64}} {

    let addresses = BlackMarketplace.getSellers()

    var saleOffers: {Address:{UInt64: UFix64}} = {}

    for address in addresses {
        let account = getAccount(address)
        var addressSaleOffers: {UInt64: UFix64} = {}

        let saleCollection = account.getCapability(BlackMarketplace.CollectionPublicPath).borrow<&{BlackMarketplace.SalePublic}>() 
        if(saleCollection != nil) {
            let IDs = saleCollection!.getIDs()
            for id in IDs {
                addressSaleOffers[id] = saleCollection!.idPrice(tokenID: id)
            }
            saleOffers[address] = addressSaleOffers
        }
    }

    return saleOffers

}