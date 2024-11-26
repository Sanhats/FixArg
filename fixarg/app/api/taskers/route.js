import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function POST(request) {
  try {
    // Parse the JSON body
    const body = await request.json()
    
    // Validate hourly rate
    if (body.hourlyRate !== undefined) {
      const hourlyRate = parseFloat(body.hourlyRate)
      if (isNaN(hourlyRate) || hourlyRate < 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid hourly rate. Must be a non-negative number.',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }
      body.hourlyRate = hourlyRate // Ensure it's stored as a number
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10)
    
    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("FixArg")
    
    // Ensure the taskers collection exists
    const collections = await db.listCollections({ name: 'trabajadores' }).toArray()
    if (collections.length === 0) {
      await db.createCollection('trabajadores')
    }
    
    // Insert the new tasker document
    const result = await db.collection('trabajadores').insertOne({
      ...body,
      password: hashedPassword,
      status: 'pending',
      createdAt: new Date(),
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application submitted successfully',
        id: result.insertedId
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Database Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to submit application',
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}