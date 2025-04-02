'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'

export default function Reviews({ workerId }) {
  const [reviews, setReviews] = useState([])
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { getToken, isLoggedIn, getSupabaseClient } = useAuth()

  useEffect(() => {
    fetchReviews()
  }, [workerId])

  const fetchReviews = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          usuarios(first_name, last_name)
        `)
        .eq('trabajador_id', workerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar los datos para mantener compatibilidad con el formato anterior
      const formattedReviews = data.map(review => ({
        _id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        user: {
          firstName: review.usuarios.first_name,
          lastName: review.usuarios.last_name
        }
      }))

      setReviews(formattedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      setError('No se pudieron cargar las reseñas')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      setError('Debes iniciar sesión para dejar una reseña')
      return
    }

    if (newReview.rating === 0) {
      setError('Por favor selecciona una calificación')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            trabajador_id: workerId,
            rating: newReview.rating,
            comment: newReview.comment
          }
        ])
        .select()

      if (error) {
        if (error.code === '23505') { // Código de error para violación de restricción única
          setError('Ya has realizado una reseña para este trabajador')
        } else {
          throw error
        }
      } else {
        // Limpiar el formulario y actualizar las reseñas
        setNewReview({ rating: 0, comment: '' })
        fetchReviews()