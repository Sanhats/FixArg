import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'

const BUCKET = 'tasker-docs'

/**
 * POST /api/upload
 * Sube un archivo (documento antecedentes, DNI, foto perfil) a Supabase Storage.
 * Body: multipart/form-data con campo "file".
 * Query: ?folder=antecedentes|dni|profile (opcional)
 * Devuelve: { url }
 * Crear el bucket "tasker-docs" en Supabase Dashboard (Storage) y configurarlo público si quieres URLs públicas.
 */
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }
    const folder = (request.nextUrl.searchParams.get('folder') || 'docs').replace(/[^a-z0-9_-]/gi, '')
    const ext = (file.name || '').split('.').pop() || 'bin'
    const path = `${folder}/${crypto.randomUUID()}.${ext}`

    const buf = Buffer.from(await file.arrayBuffer())
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buf, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: error.message || 'Error al subir el archivo. Crea el bucket "tasker-docs" en Supabase Storage.' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)
    return NextResponse.json({ url: urlData.publicUrl, path: data.path })
  } catch (err) {
    console.error('Upload:', err)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}
