'use client'

import { useState, useEffect } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import Reviews from './reviews'

export default function WorkerProfile({ worker, averageRating: propRating, reviewCount: propCount }) {
  const [averageRating, setAverageRating] = useState(propRating ?? 0)
  const [totalReviews, setTotalReviews] = useState(propCount ?? 0)

  useEffect(() => {
    if (worker?.averageRating != null && worker?.reviewCount != null) {
      setAverageRating(Number(worker.averageRating))
      setTotalReviews(worker.reviewCount)
    }
    fetchReviews()
  }, [worker?._id, worker?.averageRating, worker?.reviewCount])

  const fetchReviews = async () => {
    if (!worker?._id) return
    try {
      const response = await fetch(`/api/reviews?workerId=${worker._id}`)
      const data = await response.json()
      if (response.ok && Array.isArray(data)) {
        const total = data.reduce((acc, review) => acc + review.rating, 0)
        setAverageRating(data.length > 0 ? total / data.length : (worker.averageRating ?? 0))
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

  const skills = Array.isArray(worker?.skillsJson) ? worker.skillsJson : []

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="h-24 w-24 shrink-0 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
          {worker?.profilePhotoUrl ? (
            <img src={worker.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-gray-400">
              {(worker?.firstName?.[0] || '') + (worker?.lastName?.[0] || '')}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold mb-1">
            {worker?.displayName || `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim() || 'Profesional'}
          </h2>
          <p className="text-gray-600 mb-2">{worker?.occupation}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {renderStars(averageRating)}
            </div>
            <span className="text-sm text-gray-600">
              ({averageRating.toFixed(1)}) · {totalReviews} reseñas
            </span>
          </div>
          <div className="text-right mt-2">
            <p className="text-xl font-bold text-blue-600">${worker?.hourlyRate ?? 0}</p>
            <p className="text-sm text-gray-600">por hora</p>
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Habilidades y tarifas</h3>
          <ul className="space-y-1">
            {skills.map((s, i) => (
              <li key={i} className="flex justify-between text-gray-700">
                <span>{s.skill}</span>
                <span className="font-medium">${s.hourlyRate ?? 0}/h</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Acerca de</h3>
        <p className="text-gray-700">{worker.description}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Contacto</h3>
        <p className="text-gray-700">
          <span className="font-medium">Email:</span> {worker.email}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          La comunicación con el profesional se realiza a través del chat de la solicitud.
        </p>
      </div>

      <Reviews workerId={worker._id} />
    </div>
  )
}