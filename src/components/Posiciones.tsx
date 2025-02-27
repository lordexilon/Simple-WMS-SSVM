import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PosicionesForm from './PosicionesForm';

interface Posicion {
  id: string;
  deposito_id: string;
  rack: string;
  columna: string;
  nivel: number;
  profundidad: number;
  ocupado: boolean;
  ubicacion: string; // Agregado campo de ubicación
  deposito?: {
    nombre: string;
  };
}

const Posiciones: React.FC = () => {
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPosicion, setEditingPosicion] = useState<Posicion | null>(null);

  useEffect(() => {
    fetchPosiciones();
  }, []);

  const fetchPosiciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posiciones')
        .select(`
          *,
          deposito:depositos(nombre)
        `)
        .order('rack', { ascending: true })
        .order('columna', { ascending: true })
        .order('nivel', { ascending: true })
        .order('profundidad', { ascending: true });

      if (error) throw error;

      setPosiciones(data || []);
    } catch (error: any) {
      setError('Error al cargar las posiciones');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta posición?')) return;

    try {
      const { error } = await supabase
        .from('posiciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosiciones(posiciones.filter(p => p.id !== id));
    } catch (error: any) {
      setError('Error al eliminar la posición');
      console.error('Error:', error);
    }
  };

  const toggleOcupado = async (posicion: Posicion) => {
    try {
      const { error } = await supabase
        .from('posiciones')
        .update({ ocupado: !posicion.ocupado })
        .eq('id', posicion.id);

      if (error) throw error;

      setPosiciones(posiciones.map(p => 
        p.id === posicion.id ? { ...p, ocupado: !p.ocupado } : p
      ));
    } catch (error: any) {
      setError('Error al actualizar el estado de la posición');
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Posiciones</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Ver Listado' : 'Crear Posiciones'}
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
          <PosicionesForm 
            onSuccess={() => {
              setShowForm(false);
              fetchPosiciones();
            }} 
            editingPosicion={editingPosicion ?? null} // Asegúrate de que esto esté definido
          />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="p-4 text-center">Cargando posiciones...</div>
          ) : posiciones.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay posiciones creadas</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depósito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posiciones.map((posicion) => (
                  <tr key={posicion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{posicion.deposito?.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-gray-900">
                        {posicion.rack}{posicion.columna}{posicion.nivel}{posicion.profundidad}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleOcupado(posicion)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          posicion.ocupado
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {posicion.ocupado ? 'Ocupado' : 'Libre'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          setEditingPosicion(posicion);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(posicion.id)}
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

export default Posiciones;
