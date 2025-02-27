import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import RackVisualization from './RackVisualization';

interface Position {
  id: string;
  rack: string;
  columna: string;
  nivel: number;
  profundidad: number;
  estado: string;
  deposito_id: string;
  idpallet?: string;
}

interface Deposito {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface RangeForm {
  rackStart: string;
  rackEnd: string;
  columnaStart: string;
  columnaEnd: string;
  nivelStart: number;
  nivelEnd: number;
  profundidadStart: number;
  profundidadEnd: number;
  estado: string;
  deposito_id: string;
}

const Posiciones: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [selectedDeposito, setSelectedDeposito] = useState<string>('');
  const [selectedRack, setSelectedRack] = useState<string>('');
  const [selectedColumna, setSelectedColumna] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [show3D, setShow3D] = useState(false);
  const [rangeForm, setRangeForm] = useState<RangeForm>({
    rackStart: 'A',
    rackEnd: 'A',
    columnaStart: 'A',
    columnaEnd: 'O',
    nivelStart: 1,
    nivelEnd: 3,
    profundidadStart: 1,
    profundidadEnd: 3,
    estado: 'DISPONIBLE',
    deposito_id: ''
  });

  // Función para generar el rango de letras
  const generateLetterRange = (start: string, end: string): string[] => {
    const startCode = start.charCodeAt(0);
    const endCode = end.charCodeAt(0);
    return Array.from(
      { length: endCode - startCode + 1 },
      (_, i) => String.fromCharCode(startCode + i)
    );
  };

  // Generar todas las letras posibles para columnas (A-O)
  const allPossibleColumnas = generateLetterRange('A', 'O');

  useEffect(() => {
    fetchDepositos();
  }, []);

  useEffect(() => {
    setSelectedRack('');
    setSelectedColumna('');
  }, [selectedDeposito]);

  useEffect(() => {
    if (selectedDeposito) {
      fetchPositions();
    }
  }, [selectedDeposito]);

  useEffect(() => {
    setSelectedColumna('');
  }, [selectedRack]);

  const getUniqueRacks = (positions: Position[]) => {
    return Array.from(new Set(positions.map(p => p.rack))).sort();
  };

  const getColumnasForRack = (positions: Position[], rack: string) => {
    return Array.from(
      new Set(
        positions
          .filter(p => p.rack === rack)
          .map(p => p.columna)
      )
    ).sort();
  };

  const uniqueRacks = getUniqueRacks(positions);
  const availableColumnas = selectedRack ? getColumnasForRack(positions, selectedRack) : [];

  const fetchDepositos = async () => {
    try {
      const { data, error } = await supabase
        .from('depositos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setDepositos(data || []);
      
      // Si hay depósitos, seleccionar el primero por defecto
      if (data && data.length > 0) {
        setSelectedDeposito(data[0].id);
        setRangeForm(prev => ({ ...prev, deposito_id: data[0].id }));
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('posiciones')
        .select('*')
        .eq('deposito_id', selectedDeposito)
        .order('rack')
        .order('columna')
        .order('nivel');

      if (selectedRack) {
        query = query.eq('rack', selectedRack);
      }
      if (selectedColumna) {
        query = query.eq('columna', selectedColumna);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('Posiciones cargadas:', data);
      setPositions(data || []);

      // Actualizar las listas de racks y columnas únicas
      if (data) {
        const racks = [...new Set(data.map(p => p.rack))].sort();
        const columnas = [...new Set(data.map(p => p.columna))].sort();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeForm.deposito_id) {
      alert('Por favor seleccione un depósito');
      return;
    }

    try {
      const newPositions = [];
      
      // Convertir letras a códigos ASCII para el rango
      const rackStartCode = rangeForm.rackStart.toUpperCase().charCodeAt(0);
      const rackEndCode = rangeForm.rackEnd.toUpperCase().charCodeAt(0);
      const colStartCode = rangeForm.columnaStart.toUpperCase().charCodeAt(0);
      const colEndCode = rangeForm.columnaEnd.toUpperCase().charCodeAt(0);

      for (let rackCode = rackStartCode; rackCode <= rackEndCode; rackCode++) {
        const rack = String.fromCharCode(rackCode);
        for (let colCode = colStartCode; colCode <= colEndCode; colCode++) {
          const col = String.fromCharCode(colCode);
          for (let nivel = rangeForm.nivelStart; nivel <= rangeForm.nivelEnd; nivel++) {
            for (let prof = rangeForm.profundidadStart; prof <= rangeForm.profundidadEnd; prof++) {
              newPositions.push({
                rack,
                columna: col,
                nivel,
                profundidad: prof,
                estado: rangeForm.estado,
                deposito_id: rangeForm.deposito_id
              });
            }
          }
        }
      }

      console.log('Creando posiciones:', newPositions);

      const { error } = await supabase
        .from('posiciones')
        .insert(newPositions);

      if (error) throw error;
      
      setShowForm(false);
      fetchPositions();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (position: Position) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta posición?')) return;
    
    try {
      const { error } = await supabase
        .from('posiciones')
        .delete()
        .eq('id', position.id);

      if (error) throw error;
      fetchPositions();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setRangeForm({
      rackStart: position.rack,
      rackEnd: position.rack,
      columnaStart: position.columna,
      columnaEnd: position.columna,
      nivelStart: position.nivel,
      nivelEnd: position.nivel,
      profundidadStart: position.profundidad,
      profundidadEnd: position.profundidad,
      estado: position.estado,
      deposito_id: position.deposito_id
    });
    setShowForm(true);
  };

  const getUniqueValues = (positions: Position[], field: 'rack' | 'columna') => {
    return Array.from(new Set(positions.map(p => p[field]))).sort();
  };

  const filteredPositions = positions.filter(position => {
    const matchRack = !selectedRack || position.rack === selectedRack;
    const matchColumna = !selectedColumna || position.columna === selectedColumna;
    return matchRack && matchColumna;
  });

  // Función para generar posiciones de ejemplo
  const generateExamplePositions = () => {
    if (!selectedDeposito) return;

    // Ejemplos similares a la imagen:
    // - Una caja en columna A, nivel 3 (superior)
    // - Una caja en columna C, nivel 2 (medio)
    // - Una caja en columna E, nivel 1 (inferior)
    const examplePositions = [
      {
        rack: 'A',
        columna: 'A',
        nivel: 3,
        profundidad: 1,
        estado: 'OCUPADO',
        deposito_id: selectedDeposito
      },
      {
        rack: 'A',
        columna: 'C',
        nivel: 2,
        profundidad: 2,
        estado: 'OCUPADO',
        deposito_id: selectedDeposito
      },
      {
        rack: 'A',
        columna: 'E',
        nivel: 1,
        profundidad: 3,
        estado: 'OCUPADO',
        deposito_id: selectedDeposito
      }
    ];

    // Crear las posiciones en la base de datos
    const createPositions = async () => {
      try {
        setLoading(true);
        for (const pos of examplePositions) {
          await supabase
            .from('posiciones')
            .insert([pos]);
        }
        // Recargar las posiciones
        fetchPositions();
      } catch (error) {
        console.error('Error creating example positions:', error);
        setError('Error al crear posiciones de ejemplo');
      } finally {
        setLoading(false);
      }
    };

    createPositions();
  };

  // Función para asignar un pallet a una posición
  const asignarPallet = async (positionId: string, idpallet: string) => {
    try {
      const { error } = await supabase
        .from('posiciones')
        .update({ 
          estado: 'OCUPADO',
          idpallet: idpallet 
        })
        .eq('id', positionId);

      if (error) throw error;
      
      // Recargar las posiciones
      fetchPositions();
    } catch (error) {
      console.error('Error asignando pallet:', error);
      setError('Error al asignar pallet');
    }
  };

  // Función para liberar una posición
  const liberarPosicion = async (positionId: string) => {
    try {
      const { error } = await supabase
        .from('posiciones')
        .update({ 
          estado: 'DISPONIBLE',
          idpallet: null 
        })
        .eq('id', positionId);

      if (error) throw error;
      
      // Recargar las posiciones
      fetchPositions();
    } catch (error) {
      console.error('Error liberando posición:', error);
      setError('Error al liberar posición');
    }
  };

  // Función para manejar el clic en una posición
  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
    
    // Si la posición está disponible, mostrar diálogo para asignar pallet
    if (position.estado === 'DISPONIBLE') {
      const idpallet = prompt('Ingrese el ID del pallet a asignar:');
      if (idpallet) {
        asignarPallet(position.id, idpallet);
      }
    } else {
      // Si la posición está ocupada, preguntar si desea liberar
      if (confirm('¿Desea liberar esta posición?')) {
        liberarPosicion(position.id);
      }
    }
  };

  if (loading && !positions.length) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  const defaultRangeForm = {
    rackStart: 'A',
    rackEnd: 'A',
    columnaStart: 'A',
    columnaEnd: 'O',
    nivelStart: 1,
    nivelEnd: 3,
    profundidadStart: 1,
    profundidadEnd: 3,
    estado: 'DISPONIBLE',
    deposito_id: ''
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Gestión de Posiciones</h2>
        <div className="space-x-2">
          <button
            onClick={generateExamplePositions}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!selectedDeposito}
          >
            Crear Posiciones de Ejemplo
          </button>
          <button
            onClick={() => setShow3D(!show3D)}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
            disabled={!selectedDeposito}
          >
            {show3D ? 'Ver Lista' : 'Ver 3D'}
          </button>
          {!showForm && (
            <button
              onClick={() => {
                setSelectedPosition(null);
                setRangeForm({
                  ...defaultRangeForm,
                  deposito_id: selectedDeposito
                });
                setShowForm(true);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              disabled={!selectedDeposito}
            >
              Nueva Posición
            </button>
          )}
        </div>
      </div>

      {!selectedDeposito && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Por favor, seleccione un depósito para ver o crear posiciones</p>
        </div>
      )}

      {selectedDeposito && showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-6">Crear Rango de Posiciones</h2>
            <form onSubmit={handleRangeSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selector de depósito */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depósito
                  </label>
                  <select
                    value={rangeForm.deposito_id}
                    onChange={(e) => setRangeForm({ ...rangeForm, deposito_id: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione un depósito</option>
                    {depositos.map((deposito) => (
                      <option key={deposito.id} value={deposito.id}>
                        {deposito.id} - {deposito.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rack Inicio
                  </label>
                  <input
                    type="text"
                    value={rangeForm.rackStart}
                    onChange={(e) => setRangeForm({ ...rangeForm, rackStart: e.target.value.toUpperCase() })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rack Fin
                  </label>
                  <input
                    type="text"
                    value={rangeForm.rackEnd}
                    onChange={(e) => setRangeForm({ ...rangeForm, rackEnd: e.target.value.toUpperCase() })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columna Inicio
                  </label>
                  <input
                    type="text"
                    value={rangeForm.columnaStart}
                    onChange={(e) => setRangeForm({ ...rangeForm, columnaStart: e.target.value.toUpperCase() })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columna Fin
                  </label>
                  <input
                    type="text"
                    value={rangeForm.columnaEnd}
                    onChange={(e) => setRangeForm({ ...rangeForm, columnaEnd: e.target.value.toUpperCase() })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Inicio
                  </label>
                  <input
                    type="number"
                    value={rangeForm.nivelStart}
                    onChange={(e) => setRangeForm({ ...rangeForm, nivelStart: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel Fin
                  </label>
                  <input
                    type="number"
                    value={rangeForm.nivelEnd}
                    onChange={(e) => setRangeForm({ ...rangeForm, nivelEnd: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profundidad Inicio
                  </label>
                  <input
                    type="number"
                    value={rangeForm.profundidadStart}
                    onChange={(e) => setRangeForm({ ...rangeForm, profundidadStart: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profundidad Fin
                  </label>
                  <input
                    type="number"
                    value={rangeForm.profundidadEnd}
                    onChange={(e) => setRangeForm({ ...rangeForm, profundidadEnd: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={rangeForm.estado}
                    onChange={(e) => setRangeForm({ ...rangeForm, estado: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="OCUPADO">Ocupado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {selectedPosition ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDeposito && (show3D ? (
        <RackVisualization
          positions={filteredPositions}
          onPositionClick={handlePositionClick}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPositions.map((position) => (
            <div
              key={position.id}
              className={`p-4 rounded-lg border ${
                position.estado === 'DISPONIBLE'
                  ? 'bg-green-100 border-green-200'
                  : 'bg-red-100 border-red-200'
              }`}
              onClick={() => handlePositionClick(position)}
            >
              <h3 className="font-bold text-lg">
                {position.rack}{position.columna}{position.nivel}{position.profundidad}
              </h3>
              <p className="text-sm">Estado: {position.estado}</p>
              {position.idpallet && (
                <p className="text-sm">Pallet: {position.idpallet}</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Posiciones;
