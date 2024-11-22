import React from 'react'
import MainContainer from '../components/Maincontainer'
import Header from '../components/header/header'
import Footer from '../components/Footer'

export default function Creador() {
  return (
    <div>
      <Header/>
      <MainContainer world="creador"/>
      <Footer />
    </div>
  )
}