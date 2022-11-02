import FungibleToken from "../../contracts/FungibleToken.cdc"
import FUSD from "../../contracts/FUSD.cdc"
import BasicBeastsDrop from "../../contracts/BasicBeastsDrop.cdc"

transaction(amount: UFix64, to: Address, type: String) {

    // let vault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {
        // self.vault <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount)

        BasicBeastsDrop.participate(amount: amount, vaultAddress: to, type: type, vault: <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount), address: signer.address)
    }

    execute {
    }
}