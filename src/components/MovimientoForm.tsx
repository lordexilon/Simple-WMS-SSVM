import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Definir los tipos de movimiento exactamente como están en la restricción CHECK de la base de datos
const TIPOS_MOVIMIENTO = ['ENTRADA', 'MOVIMIENTO_INTERNO', 'SALIDA'] as const;
type TipoMovimiento = typeof TIPOS_MOVIMIENTO[number];

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
}

interface PalletItem {
  producto_id: string;
  cantidad: number;
  lote: string;
  fecha_fabricacion: string;
  fecha_vencimiento: string;
}

interface MovimientoFormProps {
  onSuccess: () => void;
}

const MovimientoForm: React.FC<MovimientoFormProps> = ({ onSuccess }) => {
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('ENTRADA');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pallets, setPallets] = useState<PalletItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cantidadMovimiento, setCantidadMovimiento] = useState<number>(0);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, codigo, nombre');
      if (error) throw error;
      setProductos(data || []);
    } catch (error: any) {
      setError('Error al cargar productos');
      console.error('Error:', error);
    }
  };

  // Actualizar la cantidad total del movimiento cuando cambian los pallets
  useEffect(() => {
    const total = pallets.reduce((sum, pallet) => sum + pallet.cantidad, 0);
    setCantidadMovimiento(total);
  }, [pallets]);

  const validatePallet = (pallet: PalletItem): string | null => {
    if (!pallet.producto_id) return 'Debe seleccionar un producto';
    if (!pallet.lote) return 'Debe especificar un lote';
    if (pallet.cantidad <= 0) return 'Debe especificar una cantidad válida';
    if (!pallet.fecha_fabricacion) return 'Debe especificar fecha de fabricación';
    if (!pallet.fecha_vencimiento) return 'Debe especificar fecha de vencimiento';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pallets.length === 0) {
      setError('Debe agregar al menos un pallet');
      return;
    }

    // Validar todos los pallets
    for (const pallet of pallets) {
      const validationError = validatePallet(pallet);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar que el tipo de movimiento sea uno de los permitidos
      if (!TIPOS_MOVIMIENTO.includes(tipoMovimiento as TipoMovimiento)) {
        throw new Error(`Tipo de movimiento inválido: ${tipoMovimiento}. Debe ser uno de: ${TIPOS_MOVIMIENTO.join(', ')}`);
      }

      console.log('Tipo de movimiento:', tipoMovimiento);
      console.log('Cantidad total:', cantidadMovimiento);
      
      // Crear el movimiento con los datos exactos que espera la base de datos
      const movimientoData = {
        tipo: tipoMovimiento,
        fecha: new Date().toISOString(),
        cantidad: cantidadMovimiento || 1 // Asegurarse de que nunca sea 0 o null
      };
      
      console.log('Datos a insertar para movimiento:', movimientoData);

      // Crear el movimiento
      const { data: movimiento, error: movError } = await supabase
        .from('movimientos')
        .insert(movimientoData)
        .select()
        .single();

      if (movError) {
        console.error('Error al crear movimiento:', movError);
        throw movError;
      }

      console.log('Movimiento creado con éxito:', movimiento);

      // Preparar los pallets con los datos correctos según la estructura real de la tabla
      const palletsData = pallets.map(pallet => ({
        producto_id: pallet.producto_id,
        cantidad: pallet.cantidad,
        lote: pallet.lote,
        estado: 'POR_UBICAR', // Estado válido según la base de datos
        fecha_fabricacion: new Date(pallet.fecha_fabricacion).toISOString(),
        fecha_vencimiento: new Date(pallet.fecha_vencimiento).toISOString(),
        codigo: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generar un código único
        descripcion: `Pallet de ${productos.find(p => p.id === pallet.producto_id)?.nombre || 'producto'} - Lote: ${pallet.lote}`,
        unidad_medida: 'UNIDAD' // Valor por defecto para unidad_medida
      }));

      console.log('Datos a insertar para pallets:', palletsData);

      // Crear los pallets
      const { data: palletsInserted, error: palletsError } = await supabase
        .from('pallets')
        .insert(palletsData)
        .select(); // Añadir .select() para ver los datos insertados

      if (palletsError) {
        console.error('Error al crear pallets:', palletsError);
        throw palletsError;
      }

      console.log('Pallets creados con éxito:', palletsInserted);
      onSuccess();
      setPallets([]);
      setTipoMovimiento('ENTRADA');
      setCantidadMovimiento(0);
    } catch (error: any) {
      console.error('Error completo:', error);
      setError('Error al guardar el movimiento: ' + (error.message || error.details || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  const addPallet = () => {
    setPallets([...pallets, {
      producto_id: '',
      cantidad: 0,
      lote: '',
      fecha_fabricacion: '',
      fecha_vencimiento: ''
    }]);
  };

  const updatePallet = (index: number, field: keyof PalletItem, value: any) => {
    const newPallets = [...pallets];
    newPallets[index] = {
      ...newPallets[index],
      [field]: value
    };
    setPallets(newPallets);
  };

  const removePallet = (index: number) => {
    setPallets(pallets.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-sm rounded-lg p-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
        <select
          value={tipoMovimiento}
          onChange={(e) => setTipoMovimiento(e.target.value as TipoMovimiento)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {TIPOS_MOVIMIENTO.map(tipo => (
            <option key={tipo} value={tipo}>
              {tipo === 'ENTRADA' ? 'Entrada' : 
               tipo === 'SALIDA' ? 'Salida' : 'Movimiento Interno'}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Pallets</h3>
          <button
            type="button"
            onClick={addPallet}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Agregar Pallet
          </button>
        </div>

        {pallets.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">Cantidad total: <span className="font-bold">{cantidadMovimiento}</span></p>
          </div>
        )}

        {pallets.map((pallet, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium">Pallet #{index + 1}</h4>
              <button
                type="button"
                onClick={() => removePallet(index)}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Producto <span className="text-red-600">*</span>
                </label>
                <select
                  value={pallet.producto_id}
                  onChange={(e) => updatePallet(index, 'producto_id', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.codigo} - {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lote <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={pallet.lote}
                  onChange={(e) => updatePallet(index, 'lote', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cantidad <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={pallet.cantidad}
                  onChange={(e) => updatePallet(index, 'cantidad', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fabricación <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={pallet.fecha_fabricacion}
                  onChange={(e) => updatePallet(index, 'fecha_fabricacion', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Vencimiento <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={pallet.fecha_vencimiento}
                  onChange={(e) => updatePallet(index, 'fecha_vencimiento', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || pallets.length === 0}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Movimiento'}
        </button>
      </div>
    </form>
  );
};

export default MovimientoForm;
