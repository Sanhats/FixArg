// migrate-data.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

// Configuración de MongoDB
const mongoUri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(mongoUri);

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  try {
    // Conectar a MongoDB
    await mongoClient.connect();
    const db = mongoClient.db('FixArg');
    
    console.log('Iniciando migración de datos...');
    
    // Migrar usuarios
    console.log('Migrando usuarios...');
    const usuarios = await db.collection('usuarios').find({}).toArray();
    console.log(`Se encontraron ${usuarios.length} usuarios para migrar`);
    
    for (const usuario of usuarios) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .insert({
            id: usuario._id.toString(), // Convertir ObjectId a string
            email: usuario.email,
            first_name: usuario.firstName,
            last_name: usuario.lastName,
            phone: usuario.phone,
            hashed_password: usuario.password,
            created_at: usuario.createdAt || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error al migrar usuario ${usuario.email}:`, error);
        } else {
          console.log(`Usuario migrado: ${usuario.email}`);
        }
      } catch (err) {
        console.error(`Error inesperado al migrar usuario ${usuario.email}:`, err);
      }
    }
    
    // Migrar trabajadores
    console.log('\nMigrando trabajadores...');
    const trabajadores = await db.collection('trabajadores').find({}).toArray();
    console.log(`Se encontraron ${trabajadores.length} trabajadores para migrar`);
    
    for (const trabajador of trabajadores) {
      try {
        const { data, error } = await supabase
          .from('trabajadores')
          .insert({
            id: trabajador._id.toString(),
            email: trabajador.email,
            first_name: trabajador.firstName,
            last_name: trabajador.lastName,
            occupation: trabajador.occupation,
            hourly_rate: trabajador.hourlyRate,
            description: trabajador.description,
            phone: trabajador.phone,
            display_name: trabajador.displayName,
            status: trabajador.status || 'pending',
            hashed_password: trabajador.password,
            average_rating: trabajador.averageRating || 0,
            created_at: trabajador.createdAt || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error al migrar trabajador ${trabajador.email}:`, error);
        } else {
          console.log(`Trabajador migrado: ${trabajador.email}`);
        }
      } catch (err) {
        console.error(`Error inesperado al migrar trabajador ${trabajador.email}:`, err);
      }
    }
    
    // Migrar solicitudes
    console.log('\nMigrando solicitudes...');
    const solicitudes = await db.collection('solicitudes').find({}).toArray();
    console.log(`Se encontraron ${solicitudes.length} solicitudes para migrar`);
    
    for (const solicitud of solicitudes) {
      try {
        const { data, error } = await supabase
          .from('solicitudes')
          .insert({
            id: solicitud._id.toString(),
            descripcion: solicitud.descripcion,
            fecha: solicitud.fecha,
            hora: solicitud.hora,
            trabajador_id: solicitud.trabajadorId.toString(),
            usuario_id: solicitud.usuarioId.toString(),
            estado: solicitud.estado || 'pendiente',
            fecha_creacion: solicitud.fechaCreacion || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error al migrar solicitud ${solicitud._id}:`, error);
        } else {
          console.log(`Solicitud migrada: ${solicitud._id}`);
        }
      } catch (err) {
        console.error(`Error inesperado al migrar solicitud ${solicitud._id}:`, err);
      }
    }
    
    // Migrar reviews
    console.log('\nMigrando reviews...');
    const reviews = await db.collection('reviews').find({}).toArray();
    console.log(`Se encontraron ${reviews.length} reviews para migrar`);
    
    for (const review of reviews) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            id: review._id.toString(),
            trabajador_id: review.workerId.toString(),
            usuario_id: review.userId.toString(),
            rating: review.rating,
            comment: review.comment,
            created_at: review.createdAt || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error al migrar review ${review._id}:`, error);
        } else {
          console.log(`Review migrada: ${review._id}`);
        }
      } catch (err) {
        console.error(`Error inesperado al migrar review ${review._id}:`, err);
      }
    }
    
    // Migrar mensajes
    console.log('\nMigrando mensajes...');
    const mensajes = await db.collection('mensajes').find({}).toArray();
    console.log(`Se encontraron ${mensajes.length} mensajes para migrar`);
    
    for (const mensaje of mensajes) {
      try {
        const { data, error } = await supabase
          .from('mensajes')
          .insert({
            id: mensaje._id.toString(),
            contenido: mensaje.contenido,
            emisor_id: mensaje.emisorId.toString(),
            receptor_id: mensaje.receptorId.toString(),
            solicitud_id: mensaje.solicitudId.toString(),
            fecha_creacion: mensaje.fechaCreacion || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error al migrar mensaje ${mensaje._id}:`, error);
        } else {
          console.log(`Mensaje migrado: ${mensaje._id}`);
        }
      } catch (err) {
        console.error(`Error inesperado al migrar mensaje ${mensaje._id}:`, err);
      }
    }
    
    // Migrar mensajes de WhatsApp si existen
    try {
      const whatsappMessages = await db.collection('whatsapp_messages').find({}).toArray();
      if (whatsappMessages && whatsappMessages.length > 0) {
        console.log('\nMigrando mensajes de WhatsApp...');
        console.log(`Se encontraron ${whatsappMessages.length} mensajes de WhatsApp para migrar`);
        
        for (const mensaje of whatsappMessages) {
          try {
            const { data, error } = await supabase
              .from('whatsapp_messages')
              .insert({
                id: mensaje._id.toString(),
                phone_number: mensaje.phoneNumber || mensaje.phone_number,
                message: mensaje.message,
                status: mensaje.status || 'sent',
                created_at: mensaje.createdAt || mensaje.created_at || new Date().toISOString()
              });
            
            if (error) {
              console.error(`Error al migrar mensaje de WhatsApp ${mensaje._id}:`, error);
            } else {
              console.log(`Mensaje de WhatsApp migrado: ${mensaje._id}`);
            }
          } catch (err) {
            console.error(`Error inesperado al migrar mensaje de WhatsApp ${mensaje._id}:`, err);
          }
        }
      } else {
        console.log('No se encontraron mensajes de WhatsApp para migrar');
      }
    } catch (err) {
      console.log('La colección whatsapp_messages no existe o está vacía');
    }
    
    console.log('\nMigración completada con éxito');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await mongoClient.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

migrateData();