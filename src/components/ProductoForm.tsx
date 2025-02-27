import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  unidad_medida: string;
}

interface Props {
  producto?: Producto | null;
  onSuccess?: () => void;
}

const ProductoForm: React.FC<Props> = ({ producto, onSuccess }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    stock: 0,
    unidad_medida: 'UNIDAD'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        stock: producto.stock,
        unidad_medida: producto.unidad_medida
      });
    }
  }, [producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verificar si ya existe un producto con el mismo código
      const { data: existingProducts } = await supabase
        .from('productos')
        .select('id')
        .eq('codigo', formData.codigo)
        .neq('id', producto?.id || '');

      if (existingProducts && existingProducts.length > 0) {
        throw new Error('Ya existe un producto con este código');
      }

      if (producto) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('productos')
          .update(formData)
          .eq('id', producto.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo
        const { error: insertError } = await supabase
          .from('productos')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        stock: 0,
        unidad_medida: 'UNIDAD'
      });
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
        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
          Código
        </label>
        <input
          type="text"
          id="codigo"
          value={formData.codigo}
          onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

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
        <label htmlFor="unidad_medida" className="block text-sm font-medium text-gray-700">
          Unidad de Medida
        </label>
        <select
          id="unidad_medida"
          value={formData.unidad_medida}
          onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="UNIDAD">Unidad</option>
          <option value="KG">Kilogramo</option>
          <option value="LT">Litro</option>
          <option value="MT">Metro</option>
        </select>
      </div>

      <div>
        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
          Stock Inicial
        </label>
        <input
          type="number"
          id="stock"
          value={formData.stock}
          onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          min="0"
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
          {isLoading ? 'Guardando...' : producto ? 'Actualizar Producto' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
};

export default ProductoForm;
