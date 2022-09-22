import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import whitelist from '../data/whitelist'

const Home: NextPage = () => {

  const data = ["stuff","stuff 2"]

  return (
    <div className={styles.container}>
      <h1>Admin Dashboard</h1>
      <h2>Action: Whitelist button</h2>
      <button>Whitelist addresses</button>
      <div>{JSON.stringify(whitelist[0])}</div>
      <h2>Get: Table of whitelist</h2>
      <h2>Get: Number of whitelisted</h2>
      <h2>Get: Number of hasMinted</h2>
      <h2>Make retire button when needed</h2>
    </div>
  )
}

export default Home
