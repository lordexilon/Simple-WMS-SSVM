import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DepositoForm from './DepositoForm';

interface Deposito {
  id: string;
  nombre: string;
  descripcion: string;
  created_at: string;
}

const Depositos: React.FC = () => {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeposito, setEditingDeposito] = useState<Deposito | null>(null);

  useEffect(() => {
    fetchDepositos();
  }, []);

  const fetchDepositos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('depositos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      setDepositos(data || []);
    } catch (error: any) {
      setError('Error al cargar los depósitos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este depósito?')) return;

    try {
      const { error } = await supabase
        .from('depositos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDepositos(depositos.filter(d => d.id !== id));
    } catch (error: any) {
      setError('Error al eliminar el depósito');
      console.error('Error:', error);
    }
  };

  const handleEdit = (deposito: Deposito) => {
    setEditingDeposito(deposito);
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Depósitos</h1>
        <button
          onClick={() => {
            setEditingDeposito(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Ver Listado' : 'Crear Depósito'}
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
          <DepositoForm 
            deposito={editingDeposito}
            onSuccess={() => {
              setShowForm(false);
              setEditingDeposito(null);
              fetchDepositos();
            }} 
          />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 text-center">Cargando depósitos...</div>
          ) : depositos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay depósitos creados</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depositos.map((deposito) => (
                  <tr key={deposito.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{deposito.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{deposito.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(deposito.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(deposito)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(deposito.id)}
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

export default Depositos;
