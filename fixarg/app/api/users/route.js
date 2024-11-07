import { NextResponse } from 'next/server';
import { insertUser, findUserByEmail } from '@/lib/mongodb';
import bcrypt from 'bcryptjs'
export async function POST(request) {
  try {
    const userData = await request.json();
    console.log('Received user data:', userData);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Replace the plain text password with the hashed password
    userData.password = hashedPassword;
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return NextResponse.json({ success: false, message: 'El usuario ya existe' }, { status: 400 });
    }

    // Insert the new user into the 'usuarios' collection
    const result = await insertUser(userData);
    console.log('User inserted, result:', result);

    return NextResponse.json({ success: true, userId: result.insertedId });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Error al registrar el usuario' }, { status: 500 });
  }
}