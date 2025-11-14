"use client"
import { SeedCollectionService } from '@/src/services/SeedCollection'
import React, { useEffect, useState } from 'react'

const page = () => {


  // service for getting the data 

  const seedService = new SeedCollectionService()

  const [collections, setCollections] = useState<SeedCollectionI[]>([])


  const getData = async () => {
    setCollections(await seedService?.getAllCollections())

  }

  useEffect(() => {
    getData()
  }, [])


  return (
    <div>page

      {/* ...... list */}
      {collections?.map(c => <div className='bg-muted p-4'>
        <h1>{c?.motherTree}</h1>
        <h1>{c?.quantity} {c?.unit}</h1>
      </div>)}

    </div>
  )
}

export default page