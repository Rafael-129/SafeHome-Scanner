import { createContext, useContext, useState, useCallback } from 'react';
import ApiService from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visitantes, setVisitantes] = useState([]);
  const [historialAccesos, setHistorialAccesos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalAccesos: 0,
    autorizados: 0,
    denegados: 0
  });

  // ============ VISITANTES ============
  const cargarVisitantes = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.obtenerVisitantes(filtros);
      const rows = data?.results || data || [];
      setVisitantes(rows);
      return rows;
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar visitantes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarVisitante = useCallback(async (visitanteData) => {
    setLoading(true);
    setError(null);
    try {
      const nuevoVisitante = await ApiService.registrarVisitante(visitanteData);
      setVisitantes(prev => [nuevoVisitante, ...prev]);
      return nuevoVisitante;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ HISTORIAL ACCESOS ============
  const cargarHistorialAccesos = useCallback(async (filtros = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.obtenerHistorialAccesos(filtros);
      const rows = data?.results || data || [];
      setHistorialAccesos(rows);
      return rows;
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar historial:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarAcceso = useCallback(async (accesoData) => {
    setLoading(true);
    setError(null);
    try {
      const nuevoAcceso = await ApiService.registrarAcceso(accesoData);
      setHistorialAccesos(prev => [nuevoAcceso, ...prev]);
      return nuevoAcceso;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ ESTADÍSTICAS ============
  const cargarEstadisticas = useCallback(async (fechaDesde, fechaHasta) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.obtenerEstadisticas(fechaDesde, fechaHasta);
      setEstadisticas(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar estadísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ SCANNER ============
  const procesarEscaneo = useCallback(async (escaneoData) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await ApiService.procesarEscaneo(escaneoData);
      
      // Registrar el acceso automáticamente
      await registrarAcceso({
        idscanner: resultado.idscanner || null,
        idusuario: resultado.idusuario || null,
        idvisitante: resultado.idvisitante || null,
        estado: resultado.autorizado ? 'Permitido' : 'Denegado',
        fecha_entrada: new Date().toISOString().split('T')[0],
        hora_entrada: new Date().toTimeString().split(' ')[0],
      });

      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [registrarAcceso]);

  const value = {
    // Estado
    loading,
    error,
    visitantes,
    historialAccesos,
    estadisticas,
    
    // Métodos
    cargarVisitantes,
    registrarVisitante,
    cargarHistorialAccesos,
    registrarAcceso,
    cargarEstadisticas,
    procesarEscaneo,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
