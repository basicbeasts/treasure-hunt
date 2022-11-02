import BlackMarketplace from "../../contracts/BlackMarketplace.cdc"

pub fun main(address: Address) : [UInt64] {
    let account = getAccount(address)

    var IDs: [UInt64] = []

    let collectionRef = account.getCapability(BlackMarketplace.CollectionPublicPath).borrow<&{BlackMarketplace.SalePublic}>() 

    if(collectionRef != nil) {
        IDs = collectionRef!.getIDs()
    }

    return IDs

}