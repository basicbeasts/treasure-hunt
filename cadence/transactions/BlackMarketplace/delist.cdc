import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FUSD from "../../contracts/FUSD.cdc"
import BlackMarketplace from "../../contracts/BlackMarketplace.cdc"
import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"


transaction(
    id: UInt64
    ) {

    let chestCollection: &NFTDayTreasureChest.Collection
    let marketplace: &BlackMarketplace.SaleCollection

    prepare(account: AuthAccount) {

        let marketplaceCap = account.getCapability<&{BlackMarketplace.SalePublic}>(BlackMarketplace.CollectionPublicPath)
        // if sale collection is not created yet we make it.
        if !marketplaceCap.check() {
             let wallet =  account.getCapability<&FUSD.Vault{FungibleToken.Receiver}>(/public/fusdReceiver)
             let sale <- BlackMarketplace.createSaleCollection(ownerVault: wallet)

            // store an empty NFT Collection in account storage
            account.save<@BlackMarketplace.SaleCollection>(<- sale, to:BlackMarketplace.CollectionStoragePath)

            // publish a capability to the Collection in storage
            account.link<&{BlackMarketplace.SalePublic}>(BlackMarketplace.CollectionPublicPath, target: BlackMarketplace.CollectionStoragePath)
        }

        self.marketplace = account.borrow<&BlackMarketplace.SaleCollection>(from: BlackMarketplace.CollectionStoragePath)!
        self.chestCollection = account.borrow<&NFTDayTreasureChest.Collection>(from: NFTDayTreasureChest.CollectionStoragePath)!
    }

    execute {
        let chest <- self.marketplace.withdraw(tokenID: id)
        self.chestCollection.deposit(token: <- chest);
    }
}