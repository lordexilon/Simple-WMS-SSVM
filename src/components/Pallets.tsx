import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import PalletForm from './PalletForm';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  unidades_por_caja: number;
  cajas_por_pallet: number;
  unidades_por_pallet: number;
}

interface Pallet {
  id: string;
  codigo: string;
  descripcion: string;
  estado: string;
  cantidad: number;
  lote: string;
  fecha_fabricacion: string;
  fecha_vencimiento: string;
  producto: Producto;
}

const Pallets: React.FC = () => {
  const supabase = useSupabaseClient();
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchPallets = async () => {
    try {
      const { data, error } = await supabase
        .from('pallets')
        .select(`
          *,
          producto:producto_id (
            id,
            codigo,
            nombre,
            unidades_por_caja,
            cajas_por_pallet,
            unidades_por_pallet
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPallets(data || []);
    } catch (error) {
      console.error('Error cargando pallets:', error);
      setError('Error al cargar los pallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPallets();
  }, []);

  const handlePalletCreated = (newPallet: Pallet) => {
    setPallets([newPallet, ...pallets]);
    setShowForm(false);
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pallets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showForm ? 'Cerrar Formulario' : 'Nuevo Pallet'}
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

      {showForm && (
        <div className="mb-8">
          <PalletForm onPalletCreated={handlePalletCreated} />
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {pallets.map((pallet) => (
            <li key={pallet.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Código: {pallet.codigo}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{pallet.descripcion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Producto:</span>{' '}
                    {pallet.producto?.codigo} - {pallet.producto?.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Cantidad:</span>{' '}
                    {pallet.cantidad} unidades
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Cajas:</span>{' '}
                    {pallet.cantidad / (pallet.producto?.unidades_por_caja || 1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Lote:</span> {pallet.lote}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Fabricación:</span>{' '}
                    {new Date(pallet.fecha_fabricacion).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Vencimiento:</span>{' '}
                    {new Date(pallet.fecha_vencimiento).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Estado:</span>{' '}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pallet.estado === 'POR_UBICAR'
                        ? 'bg-yellow-100 text-yellow-800'
                        : pallet.estado === 'UBICADO'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pallet.estado}
                    </span>
                  </p>
                  {pallet.estado === 'POR_UBICAR' && (
                    <button
                      onClick={() => window.location.href = '/posiciones'}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Asignar Ubicación
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Pallets;
