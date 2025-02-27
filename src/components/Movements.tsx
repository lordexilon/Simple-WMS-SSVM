import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MovimientoForm from './MovimientoForm';

interface Movimiento {
  id: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO';
  producto: {
    codigo: string;
    nombre: string;
  };
  deposito_origen?: {
    nombre: string;
  };
  deposito_destino?: {
    nombre: string;
  };
  cantidad: number;
  fecha: string;
  observaciones?: string;
}

const Movements: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<Movimiento | null>(null);

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('movimientos')
        .select(`
          id,
          tipo,
          cantidad,
          fecha,
          observaciones,
          producto:producto_id(codigo, nombre),
          deposito_origen:deposito_origen_id(nombre),
          deposito_destino:deposito_destino_id(nombre)
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;

      setMovimientos(data || []);
    } catch (error: any) {
      setError('Error al cargar los movimientos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este movimiento?')) return;

    try {
      const { error } = await supabase
        .from('movimientos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMovimientos(movimientos.filter(m => m.id !== id));
    } catch (error: any) {
      setError('Error al eliminar el movimiento');
      console.error('Error:', error);
    }
  };

  const handleEdit = (movimiento: Movimiento) => {
    setEditingMovimiento(movimiento);
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Movimientos</h1>
        <button
          onClick={() => {
            setEditingMovimiento(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Ver Listado' : 'Crear Movimiento'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white shadow rounded-lg p-6">
          <MovimientoForm 
            movimiento={editingMovimiento}
            onSuccess={() => {
              setShowForm(false);
              setEditingMovimiento(null);
              fetchMovimientos();
            }} 
          />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 text-center">Cargando movimientos...</div>
          ) : movimientos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay movimientos registrados</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(movimiento.fecha).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movimiento.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' :
                        movimiento.tipo === 'SALIDA' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {movimiento.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{movimiento.producto.codigo}</div>
                      <div className="text-sm text-gray-500">{movimiento.producto.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movimiento.deposito_origen?.nombre || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movimiento.deposito_destino?.nombre || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{movimiento.cantidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(movimiento)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(movimiento.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Movements;
