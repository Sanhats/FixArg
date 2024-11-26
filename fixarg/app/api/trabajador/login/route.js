import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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
    const { email, password } = await request.json()

    const client = await clientPromise
    const db = client.db("FixArg")

    const trabajador = await db.collection('trabajadores').findOne({ email })

    if (!trabajador) {
      return new Response(
        JSON.stringify({ error: 'Trabajador no encontrado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, trabajador.password)

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'Contraseña incorrecta' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = jwt.sign(
      { userId: trabajador._id, email: trabajador.email, role: 'trabajador' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const userToSend = {
      _id: trabajador._id,
      email: trabajador.email,
      firstName: trabajador.firstName,
      lastName: trabajador.lastName,
      role: 'trabajador'
    }

    return new Response(
      JSON.stringify({ token, user: userToSend }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Login Error:', error)
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}