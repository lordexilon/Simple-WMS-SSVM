import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Posicion {
  id: string;
  //nombre: string;
 // descripcion: string;
  //stock: number;
  //unidad_medida: string;
 // ubicacion: string;
  deposito_id: string;
  rackDesde: string;
  rackHasta: string;
  columnaDesde: string;
  columnaHasta: string;
  nivelDesde: number;
  nivelHasta: number;
  profundidadDesde: number;
  profundidadHasta: number;
}

interface Props {
  onSuccess?: () => void;
  editingPosicion?: Posicion | null;
}

const PosicionesForm: React.FC<Props> = ({ onSuccess, editingPosicion }) => {
  const [formData, setFormData] = useState({
    //nombre: '',
    //descripcion: '',
    //stock: 0,
    ///unidad_medida: 'UNIDAD',
    //ubicacion: '',
    deposito_id: '',
    rackDesde: '',
    rackHasta: '',
    columnaDesde: '',
    columnaHasta: '',
    nivelDesde: 0,
    nivelHasta: 0,
    profundidadDesde: 0,
    profundidadHasta: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingPosicion) {
      setFormData({
       // deposito: editingPosicion.deposito_id,
        //descripcion: editingPosicion.descripcion,
       // stock: editingPosicion.stock,
        //unidad_medida: editingPosicion.unidad_medida,
       // ubicacion: editingPosicion.ubicacion,
        deposito_id: editingPosicion.deposito_id,
        rackDesde: editingPosicion.rackDesde,
        rackHasta: editingPosicion.rackHasta,
        columnaDesde: editingPosicion.columnaDesde,
        columnaHasta: editingPosicion.columnaHasta,
        nivelDesde: editingPosicion.nivelDesde,
        nivelHasta: editingPosicion.nivelHasta,
        profundidadDesde: editingPosicion.profundidadDesde,
        profundidadHasta: editingPosicion.profundidadHasta,
      });
    }
  }, [editingPosicion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Lógica para crear o modificar posiciones
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError(error.message);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos del formulario para posiciones */}
      <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        {editingPosicion ? 'Modificar' : 'Agregar'}
      </button>
    </form>
  );
};

export default PosicionesForm;
