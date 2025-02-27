import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Deposito {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Props {
  deposito?: Deposito | null;
  onSuccess?: () => void;
}

const DepositoForm: React.FC<Props> = ({ deposito, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deposito) {
      setFormData({
        nombre: deposito.nombre,
        descripcion: deposito.descripcion
      });
    }
  }, [deposito]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verificar si ya existe un depósito con el mismo nombre
      const { data: existingDepositos } = await supabase
        .from('depositos')
        .select('id')
        .eq('nombre', formData.nombre)
        .neq('id', deposito?.id || '');

      if (existingDepositos && existingDepositos.length > 0) {
        throw new Error('Ya existe un depósito con este nombre');
      }

      if (deposito) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('depositos')
          .update(formData)
          .eq('id', deposito.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from('depositos')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      setFormData({ nombre: '', descripcion: '' });
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
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          type="text"
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
          rows={3}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Guardando...' : deposito ? 'Actualizar Depósito' : 'Crear Depósito'}
        </button>
      </div>
    </form>
  );
};

export default DepositoForm;
