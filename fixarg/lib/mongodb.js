import { MongoClient } from 'mongodb'

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
    const result = await db.collection('taskers').insertOne(taskerData)
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
    
    console.log('All collections:', collectionNames)
  } catch (error) {
    console.error('Failed to initialize collections:', error)
    throw error
  }
}

// Call this function when your application starts
initializeCollections().catch(console.error)