import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true
}

let client
let clientPromise

async function connectWithRetry(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      if (!client) {
        client = new MongoClient(uri, options)
      }
      return await client.connect()
    } catch (error) {
      console.error(`Intento ${i + 1} de ${retries} falló:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Backoff exponencial
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithRetry()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = connectWithRetry()
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
    let statusCode = 500
    let errorMessage = 'Error interno del servidor'

    if (error.code === 'ECONNRESET') {
      errorMessage = 'La conexión con la base de datos se interrumpió. Por favor, intente nuevamente.'
      // Intentar reconectar para futuros requests
      clientPromise = connectWithRetry()
    } else if (error.name === 'MongoServerSelectionError') {
      errorMessage = 'No se pudo conectar con la base de datos. Por favor, intente más tarde.'
    } else if (error.code === 11000) {
      statusCode = 409
      errorMessage = 'Ya existe un registro con estos datos.'
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'No se pudo procesar la solicitud',
        error: errorMessage
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}