import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

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

export default clientPromise

export async function connectToDatabase() {
  try {
    const client = await clientPromise
    // Use the exact case of the database name as it exists in MongoDB Atlas
    const db = client.db('FixArg')
    console.log('Successfully connected to MongoDB')
    return { client, db }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

export async function insertTasker(taskerData) {
  try {
    const { db } = await connectToDatabase()
    console.log('Attempting to insert tasker:', taskerData)
    const result = await db.collection('trabajadores').insertOne(taskerData)
    console.log('Tasker inserted successfully:', result.insertedId)
    return result
  } catch (error) {
    console.error('Failed to insert tasker:', error)
    throw error
  }
}

export async function insertUser(userData) {
  try {
    const { db } = await connectToDatabase()
    console.log('Attempting to insert user:', userData)
    const result = await db.collection('usuarios').insertOne(userData)
    console.log('User inserted successfully:', result.insertedId)
    return result
  } catch (error) {
    console.error('Failed to insert user:', error)
    throw error
  }
}

export async function findUserByEmail(email) {
  try {
    const { db } = await connectToDatabase()
    const user = await db.collection('usuarios').findOne({ email })
    console.log('User found:', user)
    return user
  } catch (error) {
    console.error('Failed to find user:', error)
    throw error
  }
}

// Initialize collections if they don't exist
export async function initializeCollections() {
  try {
    const { db } = await connectToDatabase()
    
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    if (!collectionNames.includes('usuarios')) {
      await db.createCollection('usuarios')
      console.log('Created usuarios collection')
    } else {
      console.log('usuarios collection already exists')
    }
    
    if (!collectionNames.includes('trabajadores')) {
      await db.createCollection('trabajadores')
      console.log('Created trabajadores collection')
    } else {
      console.log('trabajadores collection already exists')
    }
    
    console.log('All collections:', collectionNames)
  } catch (error) {
    console.error('Failed to initialize collections:', error)
    throw error
  }
}

// New function to find a worker by email
export async function findWorkerByEmail(email) {
  try {
    const { db } = await connectToDatabase()
    const worker = await db.collection('trabajadores').findOne({ email })
    console.log('Worker found:', worker)
    return worker
  } catch (error) {
    console.error('Failed to find worker:', error)
    throw error
  }
}

// New function to create password for a worker
export async function createWorkerPassword(email, password) {
  try {
    const { db } = await connectToDatabase()
    const worker = await findWorkerByEmail(email)
    
    if (!worker) {
      throw new Error('Worker not found')
    }
    
    if (worker.password) {
      throw new Error('Password already set for this worker')
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const result = await db.collection('trabajadores').updateOne(
      { _id: worker._id },
      { 
        $set: { 
          password: hashedPassword,
          passwordCreatedAt: new Date()
        } 
      }
    )
    
    console.log('Password created for worker:', result.modifiedCount)
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Failed to create worker password:', error)
    throw error
  }
}

// New function to verify worker password
export async function verifyWorkerPassword(email, password) {
  try {
    const worker = await findWorkerByEmail(email)
    
    if (!worker || !worker.password) {
      return false
    }
    
    const isMatch = await bcrypt.compare(password, worker.password)
    return isMatch
  } catch (error) {
    console.error('Failed to verify worker password:', error)
    throw error
  }
}

// Call this function when your application starts
initializeCollections().catch(console.error)

