import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  w: 'majority',
  wtimeoutMS: 10000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 150000,
  serverSelectionTimeoutMS: 60000
}

let client
let clientPromise

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 2000

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const newClient = new MongoClient(uri, options)
      await newClient.connect()
      console.log(`Successfully connected to MongoDB on attempt ${attempt}`)
      return newClient
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error)
      if (attempt === MAX_RETRIES) throw error
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithRetry()
      .then(newClient => {
        client = newClient
        return client
      })
      .catch(error => {
        console.error('Failed to establish initial connection:', error)
        throw error
      })
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = connectWithRetry()
    .then(newClient => {
      client = newClient
      return client
    })
    .catch(error => {
      console.error('Failed to establish initial connection:', error)
      throw error
    })
}

export default clientPromise

export async function connectToDatabase() {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 2000; // 2 seconds

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await clientPromise;
      if (!client.topology || !client.topology.isConnected()) {
        console.log(`Reconnecting to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
        await client.connect();
      }
      const db = client.db('FixArg');
      return { client, db };
    } catch (error) {
      console.error(`Failed to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt === MAX_RETRIES) {
        console.error('Max retries reached. Throwing error.');
        throw error;
      }

      const isNetworkError = 
        error.name === 'MongoNetworkError' || 
        error.code === 'ECONNRESET' || 
        error.message.includes('ECONNRESET');

      if (!isNetworkError) {
        throw error;
      }

      const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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

