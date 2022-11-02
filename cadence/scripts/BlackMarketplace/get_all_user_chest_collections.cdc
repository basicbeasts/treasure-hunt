import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"
      
pub fun main(addresses: [Address]) : {Address:[UInt64]} {
    var dict: {Address:[UInt64]} = {}

    for address in addresses {
        let account = getAccount(address)

        var IDs: [UInt64] = []

        let collectionRef = account.getCapability(NFTDayTreasureChest.CollectionPublicPath).borrow<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>() 

        if(collectionRef != nil) {
            IDs = collectionRef!.getIDs()
            dict[address] = IDs
        }
        
    }
    return dict
}