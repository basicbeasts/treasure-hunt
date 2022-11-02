import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import whitelistData from '../data/whitelist'
import * as fcl from '@onflow/fcl';
import {
  query,
  send,
  transaction,
  args,
  arg,
  payer,
  proposer,
  authorizations,
  limit,
  authz,
  decode,
  tx,
} from "@onflow/fcl"
import { ToastContainer, toast } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import * as t from "@onflow/types"
import { useEffect, useState } from 'react'
import { authorizationFunction } from '../authorization';

fcl.config()
.put("app.detail.title", "Basic Beasts")
.put("app.detail.icon", "https://i.imgur.com/LihLjpF.png")
// .put("accessNode.api", "http://localhost:8080") // Emulator
// .put("accessNode.api", "http://localhost:8888") // Emulator v2
// .put("discovery.wallet", "http://localhost:8701/fcl/authn")
.put("accessNode.api", process.env.NEXT_PUBLIC_ACCESS_NODE_API) // Testnet and Mainnet
.put("discovery.wallet", process.env.NEXT_PUBLIC_CHALLENGE_HANDSHAKE) // Testnet and Mainnet
.put("discovery.wallet.method", "HTTP/POST") // Needed for testnet to work as it does not allow iframe
.put("0xFungibleToken", process.env.NEXT_PUBLIC_FUNGIBLE_TOKEN_ADDRESS)
.put("0xFUSD", process.env.NEXT_PUBLIC_FUSD_ADDRESS)
.put("0xNonFungibleToken", process.env.NEXT_PUBLIC_NON_FUNGIBLE_TOKEN_ADDRESS)
.put("0xMetadataViews", process.env.NEXT_PUBLIC_METADATA_VIEWS_ADDRESS)
.put("0xNFTDayTreasureChest", process.env.NEXT_PUBLIC_NFT_DAY_TREASURE_CHEST_ADDRESS)
.put("0xFlowToken", process.env.NEXT_PUBLIC_FLOW_TOKEN_ADDRESS)
.put("0xTreasureChestFUSDReward", process.env.NEXT_PUBLIC_NFT_DAY_TREASURE_CHEST_ADDRESS)
.put("0xBlackMarketplace", process.env.NEXT_PUBLIC_NFT_DAY_TREASURE_CHEST_ADDRESS)
.put("0xBasicBeastsDrop", process.env.NEXT_PUBLIC_NFT_DAY_TREASURE_CHEST_ADDRESS)

const Home: NextPage = () => {

  const data = ["stuff","stuff 2"]

  const [user, setUser] = useState({ addr: null })
  const [whitelist, setWhitelist] = useState<any>([])

  const [minted, setMinted] = useState<any>([])

  const [NFT, setNFT] = useState<any>(null)

  const [balance, setBalance] = useState(0)

  const [allRewards, setAllRewards] = useState([])

  const [rewardsClaimed, setRewardsClaimed] = useState({})

  const [saleOffers, setSaleOffers] = useState([])
  const [salePrices, setSalePrices] = useState([])

  const [aBalance, setABalance] = useState(0)

  // const adminAddress = "0xf8d6e0586b0a20c7" // Emulator
  // const adminAddress = "0xee1558af21b66f03" // Testnet
  const adminAddress= "0x117396d8a72ad372" // Mainnet
  useEffect(() => {
    fcl.currentUser().subscribe(setUser)
  }, [])

  useEffect(() => {
    getWhitelist()
    getMinted()
    getChestCollection()
    getFUSDBalance()
    getAllRewards()
    getRewardsClaimed()
    getSaleOffers()
    getSalePrices()
    getCurrentDrop()
    getDrops()
    getCurrentDropData()
    getABalance()
  }, [])
  

  const getWhitelist = async () => {
    try {
      let response = await query({
        cadence: `
        import NFTDayTreasureChest from 0xNFTDayTreasureChest
        
        pub fun main(): [Address] {
          return NFTDayTreasureChest.getWhitelist()
        }
        `
      })
      setWhitelist(response)
      console.log("getWhitelist(): fetched")
    } catch (err) {
      console.log(err)
    }
  }

  const getMinted = async () => {
    try {
      let response = await query({
        cadence: `
        import NFTDayTreasureChest from 0xNFTDayTreasureChest
        
        pub fun main(): [Address] {
          return NFTDayTreasureChest.getMinted()
        }
        `
      })
      setMinted(response)
      console.log("getMinted(): fetched")
    } catch (err) {
      console.log(err)
    }
  }


  const whitelistAddresses = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import MetadataViews from 0xMetadataViews
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        transaction(addresses: [Address]) {
          let adminRef: &NFTDayTreasureChest.Admin

          prepare(signer: AuthAccount) {
            self.adminRef = signer.borrow<&NFTDayTreasureChest.Admin>(from: NFTDayTreasureChest.AdminStoragePath)
            ?? panic("Account does not store an Admin resource at the specified path")
          }

          execute {

            var i = 0

            while addresses.length > i {
              self.adminRef.whitelistAddress(address: addresses[i])
              i = i + 1
            }

          }

        }

        `),
        args([arg(whitelistData, t.Array(t.Address))]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getWhitelist()
        getMinted()
        getChestCollection()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const getChestCollection = async () => {
    try {
      let response = await query({
        cadence: `
        import NFTDayTreasureChest from 0xNFTDayTreasureChest
        import NonFungibleToken from 0xNonFungibleToken

        // This script borrows an NFT from a collection
        pub fun main(): &NonFungibleToken.NFT {
          let account = getAccount(0x117396d8a72ad372)

          let collectionRef = account
              .getCapability(NFTDayTreasureChest.CollectionPublicPath)
              .borrow<&{NonFungibleToken.CollectionPublic}>()
              ?? panic("Could not borrow capability from public collection")
          
          let ids = collectionRef.getIDs()
          
          return collectionRef.borrowNFT(id: ids[0])
        }
        `
      })
      setNFT(response)
      console.log("getMinted(): fetched")
    } catch (err) {
      console.log(err)
    }
  }

  const mint = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import MetadataViews from 0xMetadataViews
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        pub fun hasChestCollection(_ address: Address): Bool {
          return getAccount(address)
            .getCapability<&NFTDayTreasureChest.Collection{NonFungibleToken.CollectionPublic, NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>(NFTDayTreasureChest.CollectionPublicPath)
            .check()
        }

        transaction() {
          let chestReceiverRef: &{NonFungibleToken.CollectionPublic}

          prepare(signer: AuthAccount) {

            // Return early if the account already has a collection
            if signer.borrow<&NFTDayTreasureChest.Collection>(from: NFTDayTreasureChest.CollectionStoragePath) == nil {
              // Create a new empty collection
              let collection <- NFTDayTreasureChest.createEmptyCollection()
  
              // save it to the account
              signer.save(<-collection, to: NFTDayTreasureChest.CollectionStoragePath)
  
              // create a public capability for the collection
              signer.link<&{NonFungibleToken.CollectionPublic, NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic, MetadataViews.ResolverCollection}>(
                  NFTDayTreasureChest.CollectionPublicPath,
                  target: NFTDayTreasureChest.CollectionStoragePath
              )
            }

            self.chestReceiverRef = signer
            .getCapability(NFTDayTreasureChest.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")

          }

          execute {

            NFTDayTreasureChest.mintNFT(recipient: self.chestReceiverRef)

          }

        }

        `),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getWhitelist()
        getMinted()
        getChestCollection()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const retire = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import MetadataViews from 0xMetadataViews
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        transaction() {
          let adminRef: &NFTDayTreasureChest.Admin

          prepare(signer: AuthAccount) {
            self.adminRef = signer.borrow<&NFTDayTreasureChest.Admin>(from: NFTDayTreasureChest.AdminStoragePath)
            ?? panic("Account does not store an Admin resource at the specified path")
          }

          execute {

            self.adminRef.retire()

          }

        }

        `),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getWhitelist()
        getMinted()
        getChestCollection()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const addRoyalty = async (address: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import MetadataViews from 0xMetadataViews
        import FlowToken from 0xFlowToken
        import FungibleToken from 0xFungibleToken
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        transaction(address: Address) {
          let adminRef: &NFTDayTreasureChest.Admin
          let beneficiaryCapability: &FlowToken.Vault{FungibleToken.Receiver}

          prepare(signer: AuthAccount) {

            self.adminRef = signer.borrow<&NFTDayTreasureChest.Admin>(from: NFTDayTreasureChest.AdminStoragePath)
            ?? panic("Account does not store an Admin resource at the specified path")

            self.beneficiaryCapability = getAccount(address).getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)
          }

          execute {

            self.adminRef.addRoyalty(beneficiaryCapability: self.beneficiaryCapability, cut: 0.05, description: "Basic Beasts receives 5% royalty from secondary sales.")

          }

        }

        `),
        args([arg(address, t.Address)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getWhitelist()
        getMinted()
    getChestCollection()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const logIn = () => {
    fcl.authenticate()
  }

  const setupFUSD = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken
        
        transaction () {
            // let sentVault: @FungibleToken.Vault
          
            prepare(signer: AuthAccount) {
              if signer.borrow<&FUSD.Vault>(from: /storage/fusdVault) == nil {
                  // Create a new FUSD Vault and put it in storage
                  signer.save(<-FUSD.createEmptyVault(), to: /storage/fusdVault)
      
                  // Create a public capability to the Vault that only exposes
                  // the deposit function through the Receiver interface
                  signer.link<&FUSD.Vault{FungibleToken.Receiver}>(
                      /public/fusdReceiver,
                      target: /storage/fusdVault
                  )
      
                  // Create a public capability to the Vault that only exposes
                  // the balance field through the Balance interface
                  signer.link<&FUSD.Vault{FungibleToken.Balance}>(
                      /public/fusdBalance,
                      target: /storage/fusdVault
                  )
              }

              
            }
          
            execute {
              
            }
          }
        
        `),
        // payer(authorizationFunction),
        // proposer(authorizationFunction),
        // authorizations([authorizationFunction]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getABalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const mintFUSD = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken
        
        transaction (amount: UFix64) {
            // let sentVault: @FungibleToken.Vault
            let tokenAdmin: &FUSD.Administrator
          
            prepare(signer: AuthAccount) {
              if signer.borrow<&FUSD.Vault>(from: /storage/fusdVault) == nil {
                  // Create a new FUSD Vault and put it in storage
                  signer.save(<-FUSD.createEmptyVault(), to: /storage/fusdVault)
      
                  // Create a public capability to the Vault that only exposes
                  // the deposit function through the Receiver interface
                  signer.link<&FUSD.Vault{FungibleToken.Receiver}>(
                      /public/fusdReceiver,
                      target: /storage/fusdVault
                  )
      
                  // Create a public capability to the Vault that only exposes
                  // the balance field through the Balance interface
                  signer.link<&FUSD.Vault{FungibleToken.Balance}>(
                      /public/fusdBalance,
                      target: /storage/fusdVault
                  )
              }

              self.tokenAdmin = signer
            .borrow<&FUSD.Administrator>(from: /storage/fusdAdmin)
            ?? panic("Signer is not the token admin")

              let minter <- self.tokenAdmin.createNewMinter()
              // self.sentVault <- minter.mintTokens(amount: amount)
              
              // Get a reference to the signer's stored vault
                let vaultRef = signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)
              ?? panic("Could not borrow reference to the owner's Vault!")
              
              // let recipient = getAccount(signer.address)
              // let receiverRef = recipient.getCapability(FUSD.ReceiverPublicPath).borrow<&{FungibleToken.Receiver}>()
              //         ?? panic("Could not borrow receiver reference to the recipient's Vault")
          
              // Deposit the withdrawn tokens in the recipient's receiver
              vaultRef.deposit(from: <-minter.mintTokens(amount: amount))

              destroy minter
            }
          
            execute {
              
            }
          }
        
        `),
        args([arg("10000.00", t.UFix64)]),
        // payer(authorizationFunction),
        // proposer(authorizationFunction),
        // authorizations([authorizationFunction]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const getFUSDBalance = async () => {
    try {
      let response = await query({
        cadence: `
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken

        pub fun main(address: Address): UFix64 {
          // let account = getAccount(address)

          // if let vaultRef = account.getCapability(FUSD.BalancePublicPath).borrow<&FUSD.Vault{FungibleToken.Balance}>() {
          //   return vaultRef.balance
          // } 
          // return nil
          let vaultRef = getAccount(address)
        .getCapability(/public/fusdBalance)
        .borrow<&FUSD.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
          
        }
        `,
        args: (arg: any, t: any) => [arg(adminAddress, t.Address)],
      })
      setBalance(response)
    } catch (err) {
      console.log(err)
    }
  }
  const getABalance = async () => {
    try {
      let response = await query({
        cadence: `
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken

        pub fun main(address: Address): UFix64 {
          // let account = getAccount(address)

          // if let vaultRef = account.getCapability(FUSD.BalancePublicPath).borrow<&FUSD.Vault{FungibleToken.Balance}>() {
          //   return vaultRef.balance
          // } 
          // return nil
          let vaultRef = getAccount(address)
        .getCapability(/public/fusdBalance)
        .borrow<&FUSD.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
          
        }
        `,
        args: (arg: any, t: any) => [arg("0x179b6b1cb6755e31", t.Address)],
      })
      setABalance(response)
    } catch (err) {
      console.log(err)
    }
  }

  const createRewards = async () => {
    const id = toast.loading("Initializing...")

    var dict: any[] = []
    // dict.push({key: "0", value: "0.69"})
    // dict.push({key: "1", value: "0.69"})
    for(let i = 0; 177 > i; i++) {
      if(i==152) {
        // 69
      dict.push({key: i.toString(), value: "69.00"})
      } else if (i==58 || i==111 || i==164) {
        // 6.9
      dict.push({key: i.toString(), value: "6.90"})
      } else {
      dict.push({key: i.toString(), value: "0.69"})
      }
    }

    console.log(dict)

    try {
      const res = await send([
        transaction(`
        import TreasureChestFUSDReward from 0xTreasureChestFUSDReward
        import FUSD from 0xFUSD
        
        transaction (rewards: {UInt64: UFix64}) {
          let adminRef: &TreasureChestFUSDReward.CentralizedInbox
          let vaultRef: &FUSD.Vault

          prepare(signer: AuthAccount) {
            //get adminRef
            self.adminRef = signer.borrow<&TreasureChestFUSDReward.CentralizedInbox>(from: TreasureChestFUSDReward.CentralizedInboxStoragePath)
            ?? panic("Account does not store an Inbox resource at the specified path")

            //get vaultRef
            self.vaultRef = signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)
			        ?? panic("Could not borrow reference to the owner's Vault!")

            
          }
          execute {
            //loop rewards
            let keys = rewards.keys
            
            var i = 0
            while keys.length > i {
              //inside loop createReward(chestid, <- vaultRef.withdraw(amount))

              let key = keys[i]
              let vault <- self.vaultRef.withdraw(amount: rewards[key]!) as! @FUSD.Vault
              self.adminRef.createReward(chestID: key, reward: <-vault)
              i = i + 1
            }

          }
        }
        
        `),
        args([arg(dict, t.Dictionary({key: t.UInt64, value: t.UFix64}))]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const getAllRewards = async () => {
    try {
      let response = await query({
        cadence: `
        import TreasureChestFUSDReward from 0xTreasureChestFUSDReward
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken

        pub fun main(address: Address): [UInt64] {

          let centralizedInboxRef = getAccount(address).getCapability(TreasureChestFUSDReward.CentralizedInboxPublicPath)
            .borrow<&TreasureChestFUSDReward.CentralizedInbox{TreasureChestFUSDReward.Public}>()
            ?? panic("Could not get Centralized Inbox reference")
          return centralizedInboxRef.getChestIDs()
          
        }
        `,
        args: (arg: any, t: any) => [arg(adminAddress, t.Address)],
      })
      setAllRewards(response)
    } catch (err) {
      console.log(err)
    }
  }

  const getRewardsClaimed = async () => {
    try {
      let response = await query({
        cadence: `
        import TreasureChestFUSDReward from 0xTreasureChestFUSDReward

        pub fun main(address: Address): {UInt64: Address} {

          let centralizedInboxRef = getAccount(address).getCapability(TreasureChestFUSDReward.CentralizedInboxPublicPath)
            .borrow<&TreasureChestFUSDReward.CentralizedInbox{TreasureChestFUSDReward.Public}>()
            ?? panic("Could not get Centralized Inbox reference")
          return centralizedInboxRef.getClaimed()
          
        }
        `,
        args: (arg: any, t: any) => [arg(adminAddress, t.Address)],
      })
      setRewardsClaimed(response)
    } catch (err) {
      console.log(err)
    }
  }

  const claimReward = async (chestID: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import TreasureChestFUSDReward from 0xTreasureChestFUSDReward
        import FUSD from 0xFUSD
        import FungibleToken from 0xFungibleToken
        import NFTDayTreasureChest from 0xNFTDayTreasureChest
        
        transaction (address: Address, id: UInt64) {

          prepare(signer: AuthAccount) {
            if signer.borrow<&FUSD.Vault>(from: /storage/fusdVault) == nil {
              // Create a new FUSD Vault and put it in storage
              signer.save(<-FUSD.createEmptyVault(), to: /storage/fusdVault)
  
              // Create a public capability to the Vault that only exposes
              // the deposit function through the Receiver interface
              signer.link<&FUSD.Vault{FungibleToken.Receiver}>(
                  /public/fusdReceiver,
                  target: /storage/fusdVault
              )
  
              // Create a public capability to the Vault that only exposes
              // the balance field through the Balance interface
              signer.link<&FUSD.Vault{FungibleToken.Balance}>(
                  /public/fusdBalance,
                  target: /storage/fusdVault
              )
            }

            let receiverRef = signer
            .getCapability(/public/fusdReceiver)
            .borrow<&FUSD.Vault{FungibleToken.Receiver}>()
			        ?? panic("Could not borrow receiver reference to the recipient's Vault")
            
              let collectionRef = signer.borrow<&NFTDayTreasureChest.Collection>(from: NFTDayTreasureChest.CollectionStoragePath)
              ?? panic("Could not borrow reference to the owner's Collection!")

            let centralizedInboxRef = getAccount(address).getCapability(TreasureChestFUSDReward.CentralizedInboxPublicPath)
            .borrow<&TreasureChestFUSDReward.CentralizedInbox{TreasureChestFUSDReward.Public}>()
            ?? panic("Could not get Centralized Inbox reference")
            let chestNFT <-collectionRef.withdraw(withdrawID: id) as! @NFTDayTreasureChest.NFT
            let nft <- centralizedInboxRef.claimReward(recipient: receiverRef, chest: <-chestNFT)
            
            collectionRef.deposit(token: <-nft)
          }
          execute {}
        }
        
        `),
        args([arg(adminAddress, t.Address),arg(chestID, t.UInt64)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
        getRewardsClaimed()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const getSaleOffers = async () => {
    try {
      let response = await query({
        cadence: `
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

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
                    if(IDs.length > 0) {
                      for id in IDs {
                        addressSaleOffers[id] = saleCollection!.idPrice(tokenID: id)
                    }
                    saleOffers[address] = addressSaleOffers
                    }
                }
            }

            return saleOffers

        }
        `
      })
      setSaleOffers(response)
      console.log("sale offers fetched")
    } catch (err) {
      console.log(err)
    }
  }

  const listForSale = async (chestID: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

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
        
        `),
        args([arg(chestID, t.UInt64),arg("169.00", t.UFix64)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
        getRewardsClaimed()
        getSaleOffers()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const delist = async (chestID: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

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
        
        `),
        args([arg(chestID, t.UInt64)]),
        // payer(authorizationFunction),
        // proposer(authorizationFunction),
        // authorizations([authorizationFunction]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
        getRewardsClaimed()
        getSaleOffers()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const purchaseWithWhitelist = async (chestID: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        //this transaction buy a chest from a direct sale listing from another user
        transaction(saleAddress: Address, tokenId: UInt64, amount: UFix64) {

            // reference to the buyer's NFT collection where they
            // will store the bought NFT

            let vaultCap: Capability<&FUSD.Vault{FungibleToken.Receiver}>
            let collectionCap: Capability<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>
            // Vault that will hold the tokens that will be used
            // to buy the NFT
            let temporaryVault: @FungibleToken.Vault

            prepare(account: AuthAccount) {

                // get the references to the buyer's Vault and NFT Collection receiver
                var collectionCap = account.getCapability<&{NFTDayTreasureChest.NFTDayTreasureChestCollectionPublic}>(NFTDayTreasureChest.CollectionPublicPath)

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

                marketplace.purchaseWithWhitelist(tokenID: tokenId, recipientCap: self.collectionCap, buyTokens: <- self.temporaryVault)
            }

        }
        
        `),
        args([arg(adminAddress, t.Address), arg(chestID, t.UInt64), arg("69.00", t.UFix64)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
        getRewardsClaimed()
        getSaleOffers()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }


  const purchaseWithChest = async (chestID: any) => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest
        
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
        
        `),
        args([arg("0x179b6b1cb6755e31", t.Address), arg(chestID, t.UInt64), arg("69.00", t.UFix64)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        // payer(authz),
        // proposer(authz),
        // authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getFUSDBalance()
        getAllRewards()
        getRewardsClaimed()
        getSaleOffers()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const getSalePrices = async () => {
    try {
      let response = await query({
        cadence: `
        import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FUSD from 0xFUSD
        import BlackMarketplace from 0xBlackMarketplace
        import NFTDayTreasureChest from 0xNFTDayTreasureChest

        // This script returns the available chest sales
        pub fun main() : [UFix64] {

            let addresses = BlackMarketplace.getSellers()

            var saleOffers: [UFix64] = []

            for address in addresses {
                let account = getAccount(address)
                var addressSaleOffers: {UInt64: UFix64} = {}

                let saleCollection = account.getCapability(BlackMarketplace.CollectionPublicPath).borrow<&{BlackMarketplace.SalePublic}>() 
                if(saleCollection != nil) {
                    let IDs = saleCollection!.getIDs()
                    if(IDs.length > 0) {
                      for id in IDs {
                        saleOffers.append(saleCollection!.idPrice(tokenID: id)!)
                      }
                    }
                }
            }

            return saleOffers

        }
        `
      })
      setSalePrices(response)
      console.log("sale offers fetched")
    } catch (err) {
      console.log(err)
    }
  }

  const [currentDrop, setCurrentDrop] = useState(0)

  const getCurrentDrop = async () => {
    try {
      let response = await query({
        cadence: `
        import BasicBeastsDrop from 0xBasicBeastsDrop

        pub fun main() : UInt32 {

            return BasicBeastsDrop.currentDrop

        }
        `
      })
      setCurrentDrop(response)
    } catch (err) {
      console.log(err)
    }
  }

  const [drops, setDrops] = useState([])

  const getDrops = async () => {
    try {
      let response = await query({
        cadence: `
        import BasicBeastsDrop from 0xBasicBeastsDrop

        pub fun main() : [UInt32] {

            return BasicBeastsDrop.getDrops()

        }
        `
      })
      setDrops(response)
    } catch (err) {
      console.log(err)
    }
  }

  const [currentDropData, setCurrentDropData] = useState(null)

  const getCurrentDropData = async () => {
    try {
      let response = await query({
        cadence: `
        import BasicBeastsDrop from 0xBasicBeastsDrop

        pub fun main() : [BasicBeastsDrop.Drop]? {

            return BasicBeastsDrop.getDropData(drop: BasicBeastsDrop.currentDrop)

        }
        `
      })
      setCurrentDropData(response)
      console.log("CURRENT DROP data fetched")
    } catch (err) {
      console.log(err)
    }
  }

  const startNewDrop = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import BasicBeastsDrop from 0xBasicBeastsDrop

        transaction() {
          let adminRef: &BasicBeastsDrop.Admin

          prepare(signer: AuthAccount) {
            self.adminRef = signer.borrow<&BasicBeastsDrop.Admin>(from: BasicBeastsDrop.AdminStoragePath)
            ?? panic("Account does not store an Admin resource at the specified path")
          }

          execute {
            self.adminRef.startNewDrop()
          }

        }

        `),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getDrops()
        getCurrentDrop()
        getCurrentDropData()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const buyStarter = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import FUSD from 0xFUSD
        import BasicBeastsDrop from 0xBasicBeastsDrop

        transaction(amount: UFix64, to: Address, type: String) {

            // let vault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                // self.vault <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount)

                BasicBeastsDrop.participate(amount: amount, vaultAddress: to, type: type, vault: <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount), address: signer.address)
            }

            execute {
            }
        }

        `),
        args([arg("70.0", t.UFix64), arg("0x179b6b1cb6755e31", t.Address), arg("Starter", t.String)]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getDrops()
        getCurrentDrop()
        getCurrentDropData()
        getFUSDBalance()
        getABalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const buyCursed = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import FUSD from 0xFUSD
        import BasicBeastsDrop from 0xBasicBeastsDrop

        transaction(amount: UFix64, to: Address, type: String) {

            // let vault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                // self.vault <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount)

                BasicBeastsDrop.participate(amount: amount, vaultAddress: to, type: type, vault: <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount), address: signer.address)
            }

            execute {
            }
        }

        `),
        args([arg("600.0", t.UFix64), arg("0x179b6b1cb6755e31", t.Address), arg("Cursed Black", t.String)]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getDrops()
        getCurrentDrop()
        getCurrentDropData()
        getFUSDBalance()
        getABalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const buyShiny = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
        import FUSD from 0xFUSD
        import BasicBeastsDrop from 0xBasicBeastsDrop

        transaction(amount: UFix64, to: Address, type: String) {

            // let vault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                // self.vault <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount)

                BasicBeastsDrop.participate(amount: amount, vaultAddress: to, type: type, vault: <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount), address: signer.address)
            }

            execute {
            }
        }

        `),
        args([arg("2997.0", t.UFix64), arg("0x179b6b1cb6755e31", t.Address), arg("Shiny Gold", t.String)]),
        payer(authz),
        proposer(authz),
        authorizations([authz]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getDrops()
        getCurrentDrop()
        getCurrentDropData()
        getFUSDBalance()
        getABalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  const transferFUSD = async () => {
    const id = toast.loading("Initializing...")

    try {
      const res = await send([
        transaction(`
        import FungibleToken from 0xFungibleToken
  import FUSD from 0xFUSD

  transaction(amount: UFix64, to: Address) {

    let vault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {
        self.vault <- signer.borrow<&FUSD.Vault>(from: /storage/fusdVault)!.withdraw(amount: amount)
    }

    execute {
        getAccount(to).getCapability(/public/fusdReceiver)!.borrow<&{FungibleToken.Receiver}>()!
            .deposit(from: <-self.vault)
    }
}

        `),
        args([arg("20.0", t.UFix64), arg("0x9617c12776352e6d", t.Address)]),
        payer(authorizationFunction),
        proposer(authorizationFunction),
        authorizations([authorizationFunction]),
        limit(9999),
      ]).then(decode)

      tx(res).subscribe((res: any) => {
        if (res.status === 1) {
          toast.update(id, {
            render: "Pending...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 2) {
          toast.update(id, {
            render: "Finalizing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
        if (res.status === 3) {
          toast.update(id, {
            render: "Executing...",
            type: "default",
            isLoading: true,
            autoClose: 5000,
          })
        }
      })
      await tx(res)
        .onceSealed()
        .then((result: any) => {
          toast.update(id, {
            render: "Transaction Sealed",
            type: "success",
            isLoading: false,
            autoClose: 5000,
          })
        })
        getDrops()
        getCurrentDrop()
        getCurrentDropData()
        getFUSDBalance()
        getABalance()
    } catch (err) {
      toast.update(id, {
        render: () => <div>Error, try again later...</div>,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
      console.log(err)
    }
  }

  return (
    <>
    <ToastContainer position="bottom-right" pauseOnFocusLoss={false} />
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      <div>Logged in as: {user?.addr} </div>
      <div>{"0xf8d6e0586b0a20c7"==user?.addr&&"Emulator Admin"}</div>
      <button onClick={()=>logIn()}>log in</button>
      <button onClick={()=>fcl.unauthenticate()}>log out</button>
      <h2>Action: Whitelist button</h2>
      <button onClick={()=>whitelistAddresses()}>Whitelist addresses</button>
      <div>Whitelisted index 0: {JSON.stringify(whitelist[0], null, 2)}</div>
      <h2>Get: Table of whitelist</h2>
      <h2>Number of whitelisted: {whitelist.length}</h2>
      <h2>Number of minted: {minted.length}</h2>
      <button onClick={()=>navigator.clipboard.writeText(JSON.stringify(minted, null, 2))}>copy minted</button>
      {/* <h2>Add royalty</h2>
      <button onClick={()=>addRoyalty("0xf8d6e0586b0a20c7")}>addRoyalty(0xf8d6e0586b0a20c7)</button> */}
      <h4>Unhide Retire button when needed</h4>
      {/* <button onClick={()=>retire()}>retire (Careful! no more mints)</button> */}

    <hr/>
    </div>
    <div className={styles.container}><h1>User Mint</h1>
      <button onClick={()=>mint()}>mint/inspect nft</button>
      <div>
      {NFT!=null?<><img style={{width:"100px"}}src={NFT.thumbnail}/><pre>NFT: {JSON.stringify(NFT, null, 2)}</pre></>:<></>}</div>
    </div>
    <hr/>
    <div className={styles.container}>
      <h1>mint fusd and show balance</h1>
      <div>Admin balance: {balance}</div>
      <div>A balance: {aBalance}</div>
      <button onClick={()=>setupFUSD()}>setup FUSD</button>
      <button onClick={()=>mintFUSD()}>mint FUSD</button>
      <br/>

      <button onClick={()=>transferFUSD()}>transfer FUSD</button>
      <h1>create rewards</h1>
      <button onClick={()=>createRewards()}>createRewards</button>
      <h2>get all rewards chestID:reward</h2>
      <div>number of rewards: {allRewards.length}</div>
      <h2>claim reward and try and claim reward again</h2>
      <button onClick={()=>claimReward("0")}>Claim reward from chest</button>
      <h2>number of claimed rewards</h2>
      <div><pre>{JSON.stringify(rewardsClaimed,null,2)}</pre></div>
      <h2>add bonus</h2>
      <h2>show bonuses</h2>
    </div>
    <hr/>
    <div className={styles.container}>
      <h1>Black market</h1>
      <button onClick={()=>listForSale("8")}>List for sale</button>
      <button onClick={()=>delist("1")}>Delist sale</button>
      <button onClick={()=>purchaseWithWhitelist("0")}>purchase with whitelist</button>
      <button onClick={()=>purchaseWithChest("0")}>purchase with chest</button>
      <h2>Get Marketplace</h2>
      <div><pre>{JSON.stringify(saleOffers, null, 2)}</pre></div>

      <h2>Get Prices</h2>
      <div><pre>{JSON.stringify(salePrices, null, 2)}</pre></div>
    </div>

    <div className={styles.container}>
      <h1>Basic Beasts Drop</h1>
      <button onClick={()=>buyStarter()}>Buy Starter</button>
      <button onClick={()=> buyCursed()}>Buy Cursed Black</button>
      <button onClick={()=>buyShiny()}>Buy Shiny Gold</button>
      <h2>Current Drop: {currentDrop}</h2>
      <h2>Drops</h2>
      <div><pre>{JSON.stringify(drops, null, 2)}</pre></div>
      <button onClick={()=>navigator.clipboard.writeText(JSON.stringify(currentDropData, null, 2))}>copy drop data</button>
      <br/>
      {/* <button onClick={()=>startNewDrop()}>Start New Drop</button> */}
      <button>Start New Drop (deactivated)</button>
      <h2>Get Current Drop Data</h2>
      <div><pre>{JSON.stringify(currentDropData, null, 2)}</pre></div>
    </div>

    </>

  )
}

export default Home
