import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Error de configuración: MONGODB_URI no está definido en las variables de entorno')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 3,
  minPoolSize: 1,
  retryWrites: true,
  w: 'majority',
  wtimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 20000,
  serverSelectionTimeoutMS: 15000,
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  heartbeatFrequencyMS: 10000,
  autoReconnect: true,
  reconnectTries: 3,
  reconnectInterval: 1000,
  poolSize: 3
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const MAX_RECONNECT_ATTEMPTS = 2
const MAX_BACKOFF_MS = 5000
let client
let clientPromise
let isConnecting = false

async function connectWithRetry(attempt = 1, reconnectAttempt = 1) {
  if (client && client.topology?.isConnected()) {
    console.log('Ya existe una conexión activa a MongoDB')
    return client
  }
  if (isConnecting) {
    console.log('Ya hay un intento de conexión en curso...')
    return
  }

  isConnecting = true

  try {
    console.log(`Intento de conexión ${attempt}/${MAX_RETRIES} a MongoDB...`)
    const newClient = new MongoClient(uri, options)
    
    // Implementar ping de prueba antes de considerar la conexión exitosa
    await newClient.connect()
    await newClient.db().admin().ping()
    console.log('Conexión exitosa a MongoDB')
    
    newClient.on('close', () => {
      console.warn(`Conexión a MongoDB cerrada. Intento de reconexión ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS}`)
      if (reconnectAttempt <= MAX_RECONNECT_ATTEMPTS) {
        const backoffDelay = Math.min(RETRY_DELAY_MS * Math.pow(2, reconnectAttempt - 1), MAX_BACKOFF_MS)
        setTimeout(() => {
          connectWithRetry(1, reconnectAttempt + 1)
        }, backoffDelay)
      } else {
        console.error('Se alcanzó el límite máximo de intentos de reconexión')
        throw new Error('Error de conexión a la base de datos después de múltiples intentos')
      }
    })
    
    newClient.on('error', (error) => {
      const errorDetails = {
        message: error.message,
        code: error.code,
        name: error.name,
        timestamp: new Date().toISOString()
      }
      console.error('Error en la conexión de MongoDB:', errorDetails)
      
      if (!newClient.topology?.isConnected()) {
        if (reconnectAttempt <= MAX_RECONNECT_ATTEMPTS) {
          const backoffDelay = Math.min(RETRY_DELAY_MS * Math.pow(2, reconnectAttempt - 1), MAX_BACKOFF_MS)
          console.warn(`Conexión perdida. Intentando reconectar en ${backoffDelay}ms...`)
          setTimeout(() => {
            connectWithRetry(1, reconnectAttempt + 1)
          }, backoffDelay)
        } else {
          const finalError = new Error('Error de conexión a la base de datos después de múltiples intentos')
          finalError.details = errorDetails
          throw finalError
        }
      }
    })
    
    isConnecting = false
    return newClient
  } catch (error) {
    console.error(`Intento de conexión ${attempt} fallido:`, {
      message: error.message,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    })
    
    if (attempt === MAX_RETRIES) {
      const finalError = new Error('Error de conexión a la base de datos')
      finalError.details = {
        uri: uri.replace(/\/\/[^:]+:[^@]+@/, '\/\/***:***@'),
        error: error.message,
        attempts: attempt,
        timestamp: new Date().toISOString()
      }
      isConnecting = false
      throw finalError
    }
    
    const backoffDelay = Math.min(RETRY_DELAY_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS)
    console.log(`Esperando ${backoffDelay}ms antes de reintentar...`)
    await new Promise(resolve => setTimeout(resolve, backoffDelay))
    isConnecting = false
    return connectWithRetry(attempt + 1, reconnectAttempt)
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

