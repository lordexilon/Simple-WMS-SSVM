import React, { useEffect, useState } from 'react';
import { Package2, ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StockViewer from './StockViewer';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalEntries: 0,
    totalExits: 0,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total products
      try {
        const { count: productsCount } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true });
        
        // Get total stock
        const { data: products } = await supabase
          .from('productos')
          .select('stock');
        
        const totalStock = products?.reduce((sum, product) => sum + product.stock, 0) || 0;

        // Get movements stats
        const { data: movements } = await supabase
          .from('movimientos')
          .select('tipo, cantidad');

        const entriesExits = movements?.reduce(
          (acc, movement) => {
            if (movement.tipo === 'ENTRADA') {
              acc.entries += movement.cantidad;
            } else {
              acc.exits += movement.cantidad;
            }
            return acc;
          },
          { entries: 0, exits: 0 }
        ) || { entries: 0, exits: 0 };

        setStats({
          totalProducts: productsCount || 0,
          totalStock,
          totalEntries: entriesExits.entries,
          totalExits: entriesExits.exits
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Error fetching products.');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg mb-4">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Productos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg mb-4">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Stock Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalStock}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg mb-4">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Entradas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEntries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg mb-4">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Salidas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalExits}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Stock por Producto</h2>
        <StockViewer />
      </div>
    </div>
  );
}
