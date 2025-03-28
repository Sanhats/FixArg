"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const [professionals, setProfessionals] = useState([]);
  const [occupationFilter, setOccupationFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProfessional, setExpandedProfessional] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // Estado para la pestaña activa
  const router = useRouter();

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      console.log('Token en localStorage:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch('/api/admin/professionals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los profesionales');
      }

      const data = await response.json();
      setProfessionals(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los profesionales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('Token en useEffect:', token ? 'Token presente' : 'Token ausente');
    if (!token) {
      console.log('No hay token, redirigiendo a login');
      router.push('/admin/login');
      return;
    }
    fetchProfessionals();
  }, [router]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/admin/professionals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      setProfessionals(professionals.map(p => 
        p._id === id ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del profesional');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/admin/professionals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el profesional');
      }

      setProfessionals(professionals.filter(p => p._id !== id));
      setExpandedProfessional(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el profesional');
    }
  };

  const toggleExpandProfessional = (id) => {
    setExpandedProfessional(expandedProfessional === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const filteredProfessionals = professionals.filter(
    (p) => (activeTab === 'pending' && p.status === 'pending') || (activeTab === 'approved' && p.status === 'approved')
  );

  const occupations = [
    { value: 'all', label: 'Todas las ocupaciones' },
    { value: 'ensamblaje', label: 'Ensamblaje' },
    { value: 'montaje', label: 'Montaje' },
    { value: 'mudanza', label: 'Mudanza' },
    { value: 'limpieza', label: 'Limpieza' },
    { value: 'ayuda en exteriores', label: 'Ayuda en exteriores' },
    { value: 'reparaciones del hogar', label: 'Reparaciones del hogar' },
    { value: 'pintura', label: 'Pintura' },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Button 
          onClick={() => {
            localStorage.removeItem('adminToken');
            router.push('/admin/login');
          }} 
          variant="outline"
        >
          Cerrar sesión
        </Button>
      </div>

      <div className="flex space-x-4 mb-4">
        <Button variant={activeTab === 'pending' ? 'solid' : 'outline'} onClick={() => setActiveTab('pending')}>
          Pendientes
        </Button>
        <Button variant={activeTab === 'approved' ? 'solid' : 'outline'} onClick={() => setActiveTab('approved')}>
          Aprobados
        </Button>
      </div>

      <div className="mb-4">
        <Select value={occupationFilter} onValueChange={setOccupationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por ocupación" />
          </SelectTrigger>
          <SelectContent>
            {occupations.map((occupation) => (
              <SelectItem key={occupation.value} value={occupation.value}>
                {occupation.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProfessionals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay profesionales en esta lista
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProfessionals.map((professional) => (
            <Card key={professional._id} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {professional.firstName} {professional.lastName}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{professional.occupation || 'Ocupación no especificada'}</Badge>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpandProfessional(professional._id)}
                >
                  {expandedProfessional === professional._id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {professional.email}
                </div>
                {expandedProfessional === professional._id && (
                  <div className="mt-4 space-y-2">
                    <p><strong>Teléfono:</strong> {professional.phone || 'No especificado'}</p>
                    <p><strong>Precio/hora:</strong> {professional.hourlyRate ? `$${professional.hourlyRate}` : 'No especificado'}</p>
                    <p><strong>Descripción:</strong> {professional.description || 'Sin descripción'}</p>
                    <p><strong>Provincia:</strong> {professional.province || 'Dirección no especificada'}
                    </p>
                    <div className="flex space-x-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleStatusChange(professional._id, professional.status === 'pending' ? 'approved' : 'pending')}
                      >
                        {professional.status === 'pending' ? 'Aprobar' : 'Pendiente'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no puede deshacerse. Esto eliminará permanentemente al profesional.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(professional._id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
