import FungibleToken from "../../contracts/FungibleToken.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FUSD from "../../contracts/FUSD.cdc"
import BlackMarketplace from "../../contracts/BlackMarketplace.cdc"
import NFTDayTreasureChest from "../../contracts/NFTDayTreasureChest.cdc"

transaction(
    id: UInt64,
    price: UFix64) {

    let chestCollection: &NFTDayTreasureChest.Collection
    let marketplace: &BlackMarketplace.SaleCollection

    prepare(account: AuthAccount) {

        let marketplaceCap = account.getCapability<&{BlackMarketplace.SalePublic}>(BlackMarketplace.CollectionPublicPath)
        
        if account.borrow<&FUSD.Vault>(from: /storage/fusdVault) == nil {
            // Create a new FUSD Vault and put it in storage
            account.save(<-FUSD.createEmptyVault(), to: /storage/fusdVault)

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            account.link<&FUSD.Vault{FungibleToken.Receiver}>(
                /public/fusdReceiver,
                target: /storage/fusdVault
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            account.link<&FUSD.Vault{FungibleToken.Balance}>(
                /public/fusdBalance,
                target: /storage/fusdVault
            )
        }
        
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
        let chest <- self.chestCollection.withdraw(withdrawID: id) as! @NFTDayTreasureChest.NFT
        self.marketplace.listForSale(token: <- chest, price: price)
    }
}