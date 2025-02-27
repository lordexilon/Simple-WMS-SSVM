import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

interface ProductoStock {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  unidad_medida: string;
  depositos: {
    deposito_nombre: string;
    posicion: string;
    cantidad: number;
  }[];
}

const StockViewer: React.FC = () => {
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      // Primero obtenemos los productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .ilike('nombre', `%${searchTerm}%`)
        .order('nombre');

      if (productosError) throw productosError;

      // Para cada producto, buscamos su stock por depósito
      const productosConStock = await Promise.all(
        (productosData || []).map(async (producto) => {
          const { data: stockData } = await supabase
            .from('movimientos')
            .select(`
              cantidad,
              tipo,
              deposito_destino:deposito_destino_id(
                id,
                nombre
              ),
              deposito_origen:deposito_origen_id(
                id,
                nombre
              ),
              posicion_destino:posicion_destino_id(
                id,
                rack,
                columna,
                nivel,
                profundidad
              ),
              posicion_origen:posicion_origen_id(
                id,
                rack,
                columna,
                nivel,
                profundidad
              )
            `)
            .eq('producto_id', producto.id);

          // Calculamos el stock por depósito
          const stockPorDeposito = new Map<string, { cantidad: number; posiciones: Set<string> }>();

          stockData?.forEach(movimiento => {
            if (movimiento.tipo === 'ENTRADA') {
              const deposito = movimiento.deposito_destino;
              const posicion = movimiento.posicion_destino;
              if (deposito) {
                const actual = stockPorDeposito.get(deposito.id) || { cantidad: 0, posiciones: new Set() };
                actual.cantidad += movimiento.cantidad;
                if (posicion) {
                  actual.posiciones.add(
                    `${posicion.rack}${posicion.columna}${posicion.nivel}${posicion.profundidad}`
                  );
                }
                stockPorDeposito.set(deposito.id, actual);
              }
            } else if (movimiento.tipo === 'SALIDA') {
              const deposito = movimiento.deposito_origen;
              if (deposito) {
                const actual = stockPorDeposito.get(deposito.id) || { cantidad: 0, posiciones: new Set() };
                actual.cantidad -= movimiento.cantidad;
                stockPorDeposito.set(deposito.id, actual);
              }
            }
          });

          // Convertimos el Map a un array de depósitos
          const depositos = Array.from(stockPorDeposito.entries()).map(([depositoId, data]) => {
            const deposito = stockData?.find(m => 
              m.deposito_destino?.id === depositoId
            )?.deposito_destino;
            
            return {
              deposito_nombre: deposito?.nombre || 'Desconocido',
              posicion: Array.from(data.posiciones).join(', '),
              cantidad: data.cantidad
            };
          });

          return {
            ...producto,
            depositos
          };
        })
      );

      setProductos(productosConStock);
    } catch (error: any) {
      setError(error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProductos();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No se encontraron productos</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicaciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{producto.codigo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{producto.nombre}</div>
                    <div className="text-sm text-gray-500">{producto.descripcion}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {producto.stock} {producto.unidad_medida}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {producto.depositos.map((dep, index) => (
                      <div key={index} className="text-sm text-gray-900 mb-1">
                        <span className="font-medium">{dep.deposito_nombre}</span>:{' '}
                        {dep.cantidad} {producto.unidad_medida}
                        {dep.posicion && (
                          <span className="text-gray-500 ml-2">({dep.posicion})</span>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockViewer;
