import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, RefreshCcw, Users, TrendingUp } from 'lucide-react';
import ApiService from '../services/api';

export default function HistorialVisitantes() {
  const [visitantesRecientes, setVisitantesRecientes] = useState([]);
  const [visitasFrecuentes, setVisitasFrecuentes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const departamentosMap = useMemo(() => {
    const map = new Map();
    departamentos.forEach((dep) => {
      map.set(dep.iddepartamento, dep.codigo);
    });
    return map;
  }, [departamentos]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const [visitantesRes, frecuentesRes, departamentosRes] = await Promise.all([
        ApiService.obtenerVisitantes(),
        ApiService.obtenerVisitasFrecuentes(10),
        ApiService.obtenerDepartamentos(),
      ]);

      setVisitantesRecientes(visitantesRes?.results || visitantesRes || []);
      setVisitasFrecuentes(frecuentesRes || []);
      setDepartamentos(departamentosRes?.results || departamentosRes || []);
    } catch (err) {
      console.error('Error al cargar datos de opciones:', err);
      setError('No se pudieron cargar los datos. Intenta nuevamente.');
      setVisitantesRecientes([]);
      setVisitasFrecuentes([]);
      setDepartamentos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const getCodigoDepartamento = (iddepartamento) => {
    return departamentosMap.get(iddepartamento) || `ID ${iddepartamento || '-'}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-200">Opciones</h2>
          </div>

          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">Visitantes recientes</h3>
        </div>

        {visitantesRecientes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay visitantes registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Apellido</th>
                  <th className="py-2 pr-4">DNI</th>
                  <th className="py-2 pr-4">Departamento</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Hora</th>
                </tr>
              </thead>
              <tbody>
                {visitantesRecientes.map((v) => (
                  <tr key={v.idvisitante} className="border-b border-gray-100 dark:border-slate-800 text-slate-800 dark:text-gray-200">
                    <td className="py-2 pr-4">{v.nombre}</td>
                    <td className="py-2 pr-4">{v.apellido}</td>
                    <td className="py-2 pr-4">{v.dni}</td>
                    <td className="py-2 pr-4">{getCodigoDepartamento(v.iddepartamento)}</td>
                    <td className="py-2 pr-4">{v.fecha_visita}</td>
                    <td className="py-2 pr-4">{v.hora_visita}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">Visitas frecuentes</h3>
        </div>

        {visitasFrecuentes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin datos de visitas frecuentes.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visitasFrecuentes.map((v, idx) => (
              <div key={`${v.dni}-${idx}`} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm transition-colors">
                <p className="text-slate-800 dark:text-white font-medium">{v.nombre} {v.apellido}</p>
                <p className="text-gray-500 dark:text-gray-400">DNI: {v.dni}</p>
                <p className="text-blue-600 dark:text-blue-400">Visitas: {v.total_visitas}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
