'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'

export default function Reviews({ workerId }) {
  const [reviews, setReviews] = useState([])
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { getToken, isLoggedIn } = useAuth()

  useEffect(() => {
    fetchReviews()
  }, [workerId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?workerId=${workerId}`)
      const data = await response.json()
      if (response.ok) {
        setReviews(data)
      }
    } catch (error) {
      console.error('Error al obtener reseñas:', error)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isLoggedIn) {
      setError('Debes iniciar sesión para dejar una reseña')
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('¡Reseña enviada exitosamente!')
        setNewReview({ rating: 0, comment: '' })
        fetchReviews()
      } else {
        setError(data.error || 'Error al enviar la reseña')
      }
    } catch (error) {
      console.error('Error al enviar reseña:', error)
      setError('Error al enviar la reseña')
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
          <StarOutlineIcon className="h-5 w-5 text-gray-300" />
        )}
      </button>
    ))
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Reseñas</h3>
      
      {isLoggedIn && (
        <form onSubmit={handleSubmitReview} className="mb-8 bg-white p-4 rounded-lg shadow">
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

          {success && (
            <div className="mb-4 text-green-600 text-sm">{success}</div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={newReview.rating === 0}
          >
            Enviar reseña
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