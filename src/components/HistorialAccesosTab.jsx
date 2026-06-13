import { useState, useEffect } from 'react';
import { History, Search, CheckCircle2, XCircle, User, Clock, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ApiService from '../services/api';

const EstadisticaCard = ({ titulo, valor, Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400'
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{titulo}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{valor}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

const AccesoItem = ({ acceso }) => {
  const esAutorizado = acceso.estado === 'Autorizado';

  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-2 rounded-lg ${esAutorizado ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {esAutorizado ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-slate-800 dark:text-white font-semibold">{acceso.nombre}</h4>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                acceso.tipo === 'Residente'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                  : acceso.tipo === 'Visitante'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
              }`}>
                {acceso.tipo}
              </span>
              
              {acceso.departamento && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {acceso.departamento}
                </span>
              )}
              
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {acceso.hora}
              </span>

              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {acceso.fecha}
              </span>
            </div>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
          esAutorizado 
            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
        }`}>
          {acceso.estado}
        </div>
      </div>
    </div>
  );
};

export default function HistorialAccesosTab() {
  const [busqueda, setBusqueda] = useState('');
  const [accesos, setAccesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Cargar historial al montar el componente
  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.obtenerHistorialAccesos();
      const historialData = response.results || response;
      
      // Transformar datos del backend al formato esperado
      const historialFormateado = historialData.map(acceso => {
        // Mapear estados
        let estadoMostrar = 'Denegado';
        if (acceso.estado === 'entrada' || acceso.estado === 'Permitido') {
          estadoMostrar = 'Autorizado';
        } else if (acceso.estado === 'salida') {
          estadoMostrar = 'Salida';
        } else if (acceso.estado === 'Denegado') {
          estadoMostrar = 'Denegado';
        }

        return {
          id: acceso.idhistorial,
          nombre: acceso.usuario_info ? 
            `${acceso.usuario_info.nombre} ${acceso.usuario_info.apellido}` :
            acceso.visitante_info ?
            `${acceso.visitante_info.nombre} ${acceso.visitante_info.apellido}` :
            'Desconocido',
          tipo: acceso.idusuario ? 'Residente' : (acceso.idvisitante ? 'Visitante' : 'Desconocido'),
          departamento: acceso.usuario_info?.departamento || acceso.visitante_info?.depart_visita || 'N/A',
          hora: acceso.hora_entrada,
          fecha: acceso.fecha_entrada,
          estado: estadoMostrar
        };
      });
      
      setAccesos(historialFormateado);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('No se pudo cargar el historial de accesos');
      // Mantener datos de ejemplo en caso de error
      setAccesos([]);
    } finally {
      setLoading(false);
    }
  };

  const totalAccesos = accesos.length;
  const autorizados = accesos.filter(a => a.estado === 'Autorizado').length;
  const denegados = accesos.filter(a => a.estado === 'Denegado').length;

  const accesosFiltrados = accesos.filter(acceso => 
    acceso.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    acceso.departamento?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular paginación
  const totalPaginas = Math.ceil(accesosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const accesosPaginados = accesosFiltrados.slice(indiceInicio, indiceFin);

  // Resetear a página 1 cuando cambie la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EstadisticaCard
          titulo="Total de Accesos"
          valor={totalAccesos}
          Icon={User}
          color="blue"
        />
        <EstadisticaCard
          titulo="Autorizados"
          valor={autorizados}
          Icon={CheckCircle2}
          color="green"
        />
        <EstadisticaCard
          titulo="Denegados"
          valor={denegados}
          Icon={XCircle}
          color="red"
        />
      </div>

      {/* Lista de Accesos */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-200">Historial de Accesos</h2>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-3 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Lista de accesos */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={cargarHistorial}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Reintentar
              </button>
            </div>
          ) : accesosPaginados.length > 0 ? (
            <>
              {accesosPaginados.map(acceso => (
                <AccesoItem key={acceso.id} acceso={acceso} />
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No se encontraron resultados</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && !error && accesosFiltrados.length > registrosPorPagina && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {indiceInicio + 1} - {Math.min(indiceFin, accesosFiltrados.length)} de {accesosFiltrados.length} registros
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPaginas)].map((_, index) => {
                  const numeroPagina = index + 1;
                  // Mostrar solo algunas páginas alrededor de la actual
                  if (
                    numeroPagina === 1 ||
                    numeroPagina === totalPaginas ||
                    (numeroPagina >= paginaActual - 1 && numeroPagina <= paginaActual + 1)
                  ) {
                    return (
                      <button
                        key={numeroPagina}
                        onClick={() => cambiarPagina(numeroPagina)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          paginaActual === numeroPagina
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {numeroPagina}
                      </button>
                    );
                  } else if (
                    numeroPagina === paginaActual - 2 ||
                    numeroPagina === paginaActual + 2
                  ) {
                    return <span key={numeroPagina} className="text-gray-400 dark:text-gray-600 px-2">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
