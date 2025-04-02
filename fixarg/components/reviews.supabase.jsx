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
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('Error al enviar la reseña')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <button
        key={index}
        type={interactive ? 'button' : 'span'}
        onClick={() => interactive && setNewReview({ ...newReview, rating: index + 1 })}
        className={interactive ? 'focus:outline-none' : undefined}
      >
        {index < (interactive ? newReview.rating : rating) ? (
          <StarIcon className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIconOutline className="h-5 w-5 text-gray-300" />
        )}
      </button>
    ))
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Reseñas</h3>
      
      {isLoggedIn && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-4 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu calificación
            </label>
            <div className="flex gap-1">
              {renderStars(0, true)}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Tu comentario
            </label>
            <textarea
              id="comment"
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={newReview.rating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-600">
                  por {review.user.firstName} {review.user.lastName}
                </span>
              </div>
              <p className="text-gray-700">{review.comment}</p>
              <div className="mt-2 text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Aún no hay reseñas para este trabajador</p>
        )}
      </div>
    </div>
  )
}