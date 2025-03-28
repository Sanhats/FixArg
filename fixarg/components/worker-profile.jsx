'use client'

import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import Reviews from './reviews'
import WhatsAppMessageFormEnhanced from './whatsapp-message-form-enhanced'

export default function WorkerProfile({ worker }) {
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [worker._id])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?workerId=${worker._id}`)
      const data = await response.json()
      if (response.ok) {
        const total = data.reduce((acc, review) => acc + review.rating, 0)
        setAverageRating(data.length > 0 ? total / data.length : 0)
        setTotalReviews(data.length)
      }
    } catch (error) {
      console.error('Error al obtener reseñas:', error)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index}>
        {index < Math.floor(rating) ? (
          <StarIcon className="h-5 w-5 text-yellow-400" />
        ) : index < rating ? (
          <span className="relative">
            <StarOutlineIcon className="h-5 w-5 text-gray-300" />
            <StarIcon 
              className="absolute inset-0 text-yellow-400" 
              style={{ clipPath: `inset(0 ${100 - ((rating % 1) * 100)}% 0 0)` }}
            />
          </span>
        ) : (
          <StarOutlineIcon className="h-5 w-5 text-gray-300" />
        )}
      </span>
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {worker.firstName} {worker.lastName}
          </h2>
          <p className="text-gray-600 mb-2">{worker.occupation}</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {renderStars(averageRating)}
            </div>
            <span className="text-sm text-gray-600">
              ({averageRating.toFixed(1)}) · {totalReviews} reseñas
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            ${worker.hourlyRate}
          </p>
          <p className="text-sm text-gray-600">por hora</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Acerca de</h3>
        <p className="text-gray-700">{worker.description}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Información de contacto</h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">Email:</span> {worker.email}
          </p>
          {worker.phone && (
            <p className="text-gray-700">
              <span className="font-medium">Teléfono:</span> {worker.phone}
            </p>
          )}
        </div>
      </div>

      <Reviews workerId={worker._id} />

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Enviar mensaje por WhatsApp</h3>
        <WhatsAppMessageFormEnhanced
          trabajador={worker}
        />
      </div>
    </div>
  )
}