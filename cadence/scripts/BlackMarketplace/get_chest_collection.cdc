import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"

pub fun main(address: Address) : [UInt64] {
    let account = getAccount(address)

    var IDs: [UInt64] = []

    let collectionRef = account.getCapability(NFTDayTreasureChest.CollectionPublicPath).borrow<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>() 

    if(collectionRef != nil) {
        IDs = collectionRef!.getIDs()
    }

    return IDs

}