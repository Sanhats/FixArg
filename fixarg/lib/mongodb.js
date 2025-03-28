import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 5,
  minPoolSize: 2,
  retryWrites: true,
  w: 'majority',
  wtimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}

let client
let clientPromise

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

async function connectWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const newClient = new MongoClient(uri, options)
      await newClient.connect()
      console.log(`Successfully connected to MongoDB on attempt ${attempt}`)
      
      // Configurar event listeners para monitorear la conexión
      newClient.on('close', () => {
        console.warn('MongoDB connection closed. Attempting to reconnect...')
        connectWithRetry()
      })
      
      newClient.on('error', (error) => {
        console.error('MongoDB connection error:', error)
        if (!newClient.isConnected()) {
          console.warn('Connection lost. Attempting to reconnect...')
          connectWithRetry()
        }
      })
      
      return newClient
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error)
      if (attempt === MAX_RETRIES) {
        console.error('Max retries reached. Throwing error with details:', {
          uri: uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
          error: error.message,
          stack: error.stack
        })
        throw error
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
      console.log(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
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
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await clientPromise;
      if (!client.topology || !client.topology.isConnected()) {
        console.log(`Reconnecting to MongoDB (attempt ${attempt}/${MAX_RETRIES})...`);
        await client.connect();
      }
      const db = client.db('FixArg');
      
      // Verificar la conexión antes de retornar
      const ping = await db.command({ ping: 1 });
      if (ping.ok !== 1) {
        throw new Error('Database ping failed');
      }
      
      return { client, db };
    } catch (error) {
      console.error(`Failed to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES}):`, {
        error: error.message,
        name: error.name,
        code: error.code,
        stack: error.stack
      });
      
      if (attempt === MAX_RETRIES) {
        const errorDetails = {
          message: error.message,
          type: error.name,
          code: error.code,
          attempt: attempt,
          uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
        };
        console.error('Max retries reached. Error details:', errorDetails);
        throw new Error(`Database connection failed after ${MAX_RETRIES} attempts: ${error.message}`);
      }

      const isNetworkError = 
        error.name === 'MongoNetworkError' || 
        error.code === 'ECONNRESET' || 
        error.message.includes('ECONNRESET') ||
        error.message.includes('getaddrinfo ENOTFOUND');

      if (!isNetworkError) {
        throw error;
      }

      const delay = BASE_DELAY * Math.pow(1.5, attempt - 1); // Exponential backoff with smaller multiplier
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

