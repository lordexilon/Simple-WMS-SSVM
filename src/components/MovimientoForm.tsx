import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  stock: number;
}

interface Deposito {
  id: string;
  nombre: string;
}

interface Posicion {
  id: string;
  rack: string;
  columna: string;
  nivel: number;
  profundidad: number;
}

interface Movimiento {
  id: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO';
  producto_id: string;
  deposito_origen_id?: string;
  deposito_destino_id?: string;
  posicion_origen_id?: string;
  posicion_destino_id?: string;
  cantidad: number;
  observaciones?: string;
}

interface Props {
  movimiento?: Movimiento | null;
  onSuccess?: () => void;
}

const MovimientoForm: React.FC<Props> = ({ movimiento, onSuccess }) => {
  const [formData, setFormData] = useState<Omit<Movimiento, 'id'>>({
    tipo: 'ENTRADA',
    producto_id: '',
    deposito_origen_id: '',
    deposito_destino_id: '',
    posicion_origen_id: '',
    posicion_destino_id: '',
    cantidad: 1,
    observaciones: ''
  });

  const [productos, setProductos] = useState<Producto[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [posicionesOrigen, setPosicionesOrigen] = useState<Posicion[]>([]);
  const [posicionesDestino, setPosicionesDestino] = useState<Posicion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProductos();
    fetchDepositos();
  }, []);

  useEffect(() => {
    if (movimiento) {
      setFormData({
        tipo: movimiento.tipo,
        producto_id: movimiento.producto_id,
        deposito_origen_id: movimiento.deposito_origen_id || '',
        deposito_destino_id: movimiento.deposito_destino_id || '',
        posicion_origen_id: movimiento.posicion_origen_id || '',
        posicion_destino_id: movimiento.posicion_destino_id || '',
        cantidad: movimiento.cantidad,
        observaciones: movimiento.observaciones || ''
      });
    }
  }, [movimiento]);

  useEffect(() => {
    if (formData.deposito_origen_id) {
      fetchPosiciones(formData.deposito_origen_id, 'origen');
    }
    if (formData.deposito_destino_id) {
      fetchPosiciones(formData.deposito_destino_id, 'destino');
    }
  }, [formData.deposito_origen_id, formData.deposito_destino_id]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, codigo, nombre, stock')
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error: any) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchDepositos = async () => {
    try {
      const { data, error } = await supabase
        .from('depositos')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setDepositos(data || []);
    } catch (error: any) {
      console.error('Error al cargar depósitos:', error);
    }
  };

  const fetchPosiciones = async (depositoId: string, tipo: 'origen' | 'destino') => {
    try {
      const { data, error } = await supabase
        .from('posiciones')
        .select('id, rack, columna, nivel, profundidad')
        .eq('deposito_id', depositoId)
        .order('rack')
        .order('columna')
        .order('nivel')
        .order('profundidad');

      if (error) throw error;
      
      if (tipo === 'origen') {
        setPosicionesOrigen(data || []);
      } else {
        setPosicionesDestino(data || []);
      }
    } catch (error: any) {
      console.error('Error al cargar posiciones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validaciones según el tipo de movimiento
      if (formData.tipo === 'ENTRADA' && !formData.deposito_destino_id) {
        throw new Error('Debe seleccionar un depósito destino para la entrada');
      }
      if (formData.tipo === 'SALIDA' && !formData.deposito_origen_id) {
        throw new Error('Debe seleccionar un depósito origen para la salida');
      }
      if (formData.tipo === 'TRASLADO' && (!formData.deposito_origen_id || !formData.deposito_destino_id)) {
        throw new Error('Debe seleccionar depósito origen y destino para el traslado');
      }

      const movimientoData = {
        ...formData,
        deposito_origen_id: formData.deposito_origen_id || null,
        deposito_destino_id: formData.deposito_destino_id || null,
        posicion_origen_id: formData.posicion_origen_id || null,
        posicion_destino_id: formData.posicion_destino_id || null,
      };

      if (movimiento?.id) {
        const { error: updateError } = await supabase
          .from('movimientos')
          .update(movimientoData)
          .eq('id', movimiento.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('movimientos')
          .insert([movimientoData]);

        if (insertError) throw insertError;
      }

      // Actualizar stock del producto
      const producto = productos.find(p => p.id === formData.producto_id);
      if (producto) {
        let nuevoStock = producto.stock;
        
        if (formData.tipo === 'ENTRADA') {
          nuevoStock += formData.cantidad;
        } else if (formData.tipo === 'SALIDA') {
          nuevoStock -= formData.cantidad;
        }
        // En caso de traslado, el stock total no cambia

        if (nuevoStock < 0) {
          throw new Error('No hay suficiente stock disponible');
        }

        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', formData.producto_id);

        if (stockError) throw stockError;
      }

      if (onSuccess) onSuccess();
      
      setFormData({
        tipo: 'ENTRADA',
        producto_id: '',
        deposito_origen_id: '',
        deposito_destino_id: '',
        posicion_origen_id: '',
        posicion_destino_id: '',
        cantidad: 1,
        observaciones: ''
      });
    } catch (error: any) {
      setError(error.message);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPosicion = (posicion: Posicion) => {
    return `${posicion.rack}${posicion.columna}${posicion.nivel}${posicion.profundidad}`;
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
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo de Movimiento
        </label>
        <select
          id="tipo"
          value={formData.tipo}
          onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as Movimiento['tipo'] }))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="ENTRADA">Entrada</option>
          <option value="SALIDA">Salida</option>
          <option value="TRASLADO">Traslado</option>
        </select>
      </div>

      <div>
        <label htmlFor="producto" className="block text-sm font-medium text-gray-700">
          Producto
        </label>
        <select
          id="producto"
          value={formData.producto_id}
          onChange={(e) => setFormData(prev => ({ ...prev, producto_id: e.target.value }))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          required
        >
          <option value="">Seleccione un producto</option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.codigo} - {producto.nombre} (Stock: {producto.stock})
            </option>
          ))}
        </select>
      </div>

      {(formData.tipo === 'SALIDA' || formData.tipo === 'TRASLADO') && (
        <div>
          <label htmlFor="deposito_origen" className="block text-sm font-medium text-gray-700">
            Depósito Origen
          </label>
          <select
            id="deposito_origen"
            value={formData.deposito_origen_id}
            onChange={(e) => setFormData(prev => ({ ...prev, deposito_origen_id: e.target.value, posicion_origen_id: '' }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Seleccione un depósito</option>
            {depositos.map((deposito) => (
              <option key={deposito.id} value={deposito.id}>
                {deposito.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.deposito_origen_id && (
        <div>
          <label htmlFor="posicion_origen" className="block text-sm font-medium text-gray-700">
            Posición Origen
          </label>
          <select
            id="posicion_origen"
            value={formData.posicion_origen_id}
            onChange={(e) => setFormData(prev => ({ ...prev, posicion_origen_id: e.target.value }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Seleccione una posición</option>
            {posicionesOrigen.map((posicion) => (
              <option key={posicion.id} value={posicion.id}>
                {formatPosicion(posicion)}
              </option>
            ))}
          </select>
        </div>
      )}

      {(formData.tipo === 'ENTRADA' || formData.tipo === 'TRASLADO') && (
        <div>
          <label htmlFor="deposito_destino" className="block text-sm font-medium text-gray-700">
            Depósito Destino
          </label>
          <select
            id="deposito_destino"
            value={formData.deposito_destino_id}
            onChange={(e) => setFormData(prev => ({ ...prev, deposito_destino_id: e.target.value, posicion_destino_id: '' }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Seleccione un depósito</option>
            {depositos.map((deposito) => (
              <option key={deposito.id} value={deposito.id}>
                {deposito.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.deposito_destino_id && (
        <div>
          <label htmlFor="posicion_destino" className="block text-sm font-medium text-gray-700">
            Posición Destino
          </label>
          <select
            id="posicion_destino"
            value={formData.posicion_destino_id}
            onChange={(e) => setFormData(prev => ({ ...prev, posicion_destino_id: e.target.value }))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Seleccione una posición</option>
            {posicionesDestino.map((posicion) => (
              <option key={posicion.id} value={posicion.id}>
                {formatPosicion(posicion)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700">
          Cantidad
        </label>
        <input
          type="number"
          id="cantidad"
          value={formData.cantidad}
          onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          min="0.01"
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
          Observaciones
        </label>
        <textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
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
          {isLoading ? 'Guardando...' : movimiento ? 'Actualizar Movimiento' : 'Crear Movimiento'}
        </button>
      </div>
    </form>
  );
};

export default MovimientoForm;
