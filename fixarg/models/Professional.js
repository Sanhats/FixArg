// models/Professional.js
import { Schema, model, models } from 'mongoose'

const ProfessionalSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'El nombre es requerido'],
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es requerido'],
  },
  displayName: {
    type: String,
    required: [true, 'El nombre de profesional es requerido'],
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
  },
  occupation: {
    type: String,
    required: [true, 'La ocupación es requerida'],
    enum: ['ensamblaje', 'montaje', 'mudanza', 'limpieza', 'ayuda', 'reparar', 'pintar']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido'],
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
  },
  hourlyRate: {
    type: Number,
    required: [true, 'La tarifa por hora es requerida'],
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  profilePicture: {
    type: String,
  },
}, {
  timestamps: true
})

export default models.Professional || model('Professional', ProfessionalSchema)