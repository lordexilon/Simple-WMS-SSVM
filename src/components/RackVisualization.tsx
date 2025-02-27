import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface Position {
  id: string;
  estado: string;
  deposito_id: string;
  rack: string;
  nivel: number;
  columna: string;
  profundidad: number;
  idpallet?: string;
}

interface Deposito {
  id: string;
  nombre: string;
}

interface RackVisualizationProps {
  positions: Position[];
}

const RackVisualization: React.FC<RackVisualizationProps> = ({ positions }) => {
  const supabase = useSupabaseClient();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [selectedDeposito, setSelectedDeposito] = useState<string>('');
  const [selectedRack, setSelectedRack] = useState<string>('');
  const [selectedColumna, setSelectedColumna] = useState<string>('');
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [filteredPositions, setFilteredPositions] = useState<Position[]>(positions);

  useEffect(() => {
    fetchDepositos();
  }, []);

  useEffect(() => {
    filterPositions();
  }, [selectedDeposito, selectedRack, selectedColumna, selectedNivel, positions]);

  const fetchDepositos = async () => {
    try {
      const { data, error } = await supabase
        .from('depositos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setDepositos(data || []);
    } catch (error) {
      console.error('Error fetching depositos:', error);
    }
  };

  // Filtramos las posiciones basadas en los filtros seleccionados
  const filterPositions = () => {
    let filtered = [...positions];

    if (selectedDeposito) {
      // Aseguramos que la comparación sea con el ID del depósito
      filtered = filtered.filter(p => p.deposito_id === selectedDeposito);
    }
    if (selectedRack) {
      filtered = filtered.filter(p => p.rack === selectedRack);
    }
    if (selectedColumna) {
      filtered = filtered.filter(p => p.columna === selectedColumna);
    }
    if (selectedNivel) {
      filtered = filtered.filter(p => p.nivel === parseInt(selectedNivel));
    }

    setFilteredPositions(filtered);
  };

  const getUniqueValues = (field: keyof Position) => {
    return Array.from(new Set(positions.map(p => p[field]))).sort();
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(position);
  };

  // Función para obtener el color basado en el estado de la posición
  const getPositionColor = (estado: string) => {
    switch (estado) {
      case 'OCUPADO':
        return '#ef4444'; // Rojo
      case 'DISPONIBLE':
        return '#22c55e'; // Verde
      default:
        return '#d1d5db'; // Gris
    }
  };

  // Función auxiliar para convertir letra de columna a número
  const getColumnNumber = (columna: string) => {
    return columna.charCodeAt(0) - 'A'.charCodeAt(0);
  };

  // Agrupamos las posiciones por rack para la visualización
  const rackGroups = filteredPositions.reduce((groups, position) => {
    if (!groups[position.rack]) {
      groups[position.rack] = [];
    }
    groups[position.rack].push(position);
    return groups;
  }, {} as { [key: string]: Position[] });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depósito
            </label>
            <select
              value={selectedDeposito}
              onChange={(e) => setSelectedDeposito(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los depósitos</option>
              {depositos.map((deposito) => (
                <option key={deposito.id} value={deposito.id}>
                  {deposito.id} - {deposito.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rack
            </label>
            <select
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los racks</option>
              {getUniqueValues('rack').map((rack) => (
                <option key={rack} value={rack}>
                  Rack {rack}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Columna
            </label>
            <select
              value={selectedColumna}
              onChange={(e) => setSelectedColumna(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todas las columnas</option>
              {getUniqueValues('columna').map((columna) => (
                <option key={columna} value={columna}>
                  Columna {columna}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel
            </label>
            <select
              value={selectedNivel}
              onChange={(e) => setSelectedNivel(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos los niveles</option>
              {[1, 2, 3].map((nivel) => (
                <option key={nivel} value={nivel.toString()}>
                  Nivel {nivel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visualización 3D */}
      <div style={{ width: '100%', height: '600px', position: 'relative', background: '#f0f0f0' }}>
        <Canvas 
          camera={{ 
            position: [15, 15, 15],
            fov: 50,
            near: 0.1,
            far: 1000
          }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          
          {Object.entries(rackGroups).map(([rack, rackPositions], rackIndex) => (
            <group key={rack} position={[rackIndex * 30, 0, 0]}>
              {/* Vigas horizontales frontales */}
              {[0, 1, 2, 3].map((nivel) => (
                <mesh key={`viga-front-${nivel}`} position={[8.5, nivel * 2, 0]}>
                  <boxGeometry args={[18, 0.1, 0.1]} />
                  <meshStandardMaterial color="#f97316" />
                </mesh>
              ))}

              {/* Vigas horizontales traseras */}
              {[0, 1, 2, 3].map((nivel) => (
                <mesh key={`viga-back-${nivel}`} position={[8.5, nivel * 2, 8]}>
                  <boxGeometry args={[18, 0.1, 0.1]} />
                  <meshStandardMaterial color="#f97316" />
                </mesh>
              ))}

              {/* Columnas verticales frontales */}
              {['A', 'B', 'C', 'D', 'E', 'F'].map((col, index) => (
                <mesh key={`columna-front-${col}`} position={[index * 3.5, 3, 0]}>
                  <boxGeometry args={[0.1, 6, 0.1]} />
                  <meshStandardMaterial color="#1e3a8a" />
                </mesh>
              ))}

              {/* Columnas verticales traseras */}
              {['A', 'B', 'C', 'D', 'E', 'F'].map((col, index) => (
                <mesh key={`columna-back-${col}`} position={[index * 3.5, 3, 8]}>
                  <boxGeometry args={[0.1, 6, 0.1]} />
                  <meshStandardMaterial color="#1e3a8a" />
                </mesh>
              ))}

              {/* Posiciones */}
              {rackPositions.map((position) => (
                <group key={position.id}>
                  {/* Celda de la posición */}
                  <mesh
                    position={[
                      getColumnNumber(position.columna) * 3.5,
                      (position.nivel - 1) * 2 + 1,
                      (position.profundidad - 1) * 4
                    ]}
                    onClick={() => handlePositionClick(position)}
                  >
                    <boxGeometry args={[2.8, 1.5, 2]} />
                    <meshStandardMaterial 
                      color={position === selectedPosition ? '#0088ff' : getPositionColor(position.estado)}
                    />
                  </mesh>

                  {/* Etiqueta de la posición */}
                  <Text
                    position={[
                      getColumnNumber(position.columna) * 3.5,
                      (position.nivel - 1) * 2 + 1,
                      (position.profundidad - 1) * 4 + 1.1
                    ]}
                    fontSize={0.3}
                    color="black"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[0, 0, 0]}
                  >
                    {`${position.deposito_id}-${position.rack}-${position.columna}-${position.nivel}-${position.profundidad}`}
                  </Text>
                </group>
              ))}

              {/* Etiqueta del Rack */}
              <Text
                position={[8.5, -0.5, 4]}
                fontSize={1}
                color="black"
                anchorX="center"
                anchorY="middle"
              >
                {`Rack ${rack}`}
              </Text>

              {/* Etiquetas de profundidad */}
              {[1, 2, 3].map((prof) => (
                <Text
                  key={`prof-${prof}`}
                  position={[-1, -0.5, (prof - 1) * 4]}
                  fontSize={0.8}
                  color="black"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`Prof ${prof}`}
                </Text>
              ))}
            </group>
          ))}
        </Canvas>

        {/* Panel de información */}
        {selectedPosition && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-2">Posición</h3>
            <p><span className="font-medium">Ubicación:</span> {`${selectedPosition.deposito_id}-${selectedPosition.rack}-${selectedPosition.columna}-${selectedPosition.nivel}-${selectedPosition.profundidad}`}</p>
            <p><span className="font-medium">Estado:</span> {selectedPosition.estado}</p>
            {selectedPosition.idpallet && (
              <p><span className="font-medium">ID Pallet:</span> {selectedPosition.idpallet}</p>
            )}
            <button
              onClick={() => setSelectedPosition(null)}
              className="mt-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Leyenda */}
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg">
          <h4 className="font-bold mb-2">Leyenda</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#22c55e] mr-2"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#ef4444] mr-2"></div>
              <span>Ocupado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#0088ff] mr-2"></div>
              <span>Seleccionado</span>
            </div>
          </div>
        </div>

        {/* Información de profundidad */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
          <h4 className="font-bold mb-2">Profundidad</h4>
          <div className="space-y-1 text-sm">
            <p>1: Parte frontal</p>
            <p>2: Parte media</p>
            <p>3: Parte trasera</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RackVisualization;
