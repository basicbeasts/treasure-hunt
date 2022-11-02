import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FUSD from "../../contracts/FUSD.cdc"
import BlackMarketplace from "../../contracts/BlackMarketplace.cdc"
import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"


//this transaction buy a chest from a direct sale listing from another user
transaction(saleAddress: Address, tokenId: UInt64, amount: UFix64) {

    // reference to the buyer's NFT collection where they
    // will store the bought NFT

    let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
    let collectionCap: Capability<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>
    // Vault that will hold the tokens that will be used
    // to buy the NFT
    let temporaryVault: @FungibleToken.Vault
    let chestCollection: &NFTDayTreasureChest.Collection

    prepare(account: AuthAccount) {

        // get the references to the buyer's Vault and NFT Collection receiver
        var collectionCap = account.getCapability<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>(NFTDayTreasureChest.CollectionPublicPath)
        self.chestCollection = account.borrow<&NFTDayTreasureChest.Collection>(from: NFTDayTreasureChest.CollectionStoragePath)!

        // if collection is not created yet we make it.
        if !collectionCap.check() {
            // store an empty NFT Collection in account storage
            account.save<@NonFungibleToken.Collection>(<- NFTDayTreasureChest.createEmptyCollection(), to: NFTDayTreasureChest.CollectionStoragePath)
            // publish a capability to the Collection in storage
            account.link<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>(NFTDayTreasureChest.CollectionPublicPath, target: NFTDayTreasureChest.CollectionStoragePath)
        }

        self.collectionCap = collectionCap

        self.vaultCap = account.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)

        let vaultRef = account.borrow<&{FungibleToken.Provider}>(from: /storage/fusdVault) ?? panic("Could not borrow owner's Vault reference")

        // withdraw tokens from the buyer's Vault
        self.temporaryVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // get the read-only account storage of the seller
        let seller = getAccount(saleAddress)

        let marketplace = seller.getCapability(BlackMarketplace.CollectionPublicPath).borrow<&{BlackMarketplace.SalePublic}>()
                         ?? panic("Could not borrow seller's sale reference")

        let IDs = self.chestCollection.getIDs()

        let nft <- self.chestCollection.withdraw(withdrawID: IDs[0]) as! @NFTDayTreasureChest.NFT

        let returnedChest <- marketplace.purchaseWithTreasureChest(tokenID: tokenId, recipientCap: self.collectionCap, buyTokens: <- self.temporaryVault, chest: <-nft)

        self.chestCollection.deposit(token: <-returnedChest)
    }

}