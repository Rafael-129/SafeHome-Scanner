import { useEffect, useState } from 'react';
import { Save, UserCircle } from 'lucide-react';
import ApiService from '../services/api';

export default function PerfilTab() {
  const [perfil, setPerfil] = useState({
    nombre_aplicacion: '',
    descripcion: '',
    version: '',
    contacto_soporte: '',
    permitir_registro_sin_foto: true,
    politica_foto_requerida: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      try {
        const data = await ApiService.obtenerPerfilActual();
        setPerfil(data);
      } catch (err) {
        setMessage('No se pudo cargar el perfil de la aplicacion.');
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPerfil((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        nombre_aplicacion: perfil.nombre_aplicacion,
        descripcion: perfil.descripcion,
        version: perfil.version,
        contacto_soporte: perfil.contacto_soporte,
        permitir_registro_sin_foto: perfil.permitir_registro_sin_foto,
        politica_foto_requerida: perfil.politica_foto_requerida,
      };
      const updated = await ApiService.actualizarPerfilActual(payload);
      setPerfil(updated);
      setMessage('Perfil de aplicacion actualizado correctamente.');
    } catch (err) {
      setMessage('Error al guardar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <UserCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-200">Perfil de la Aplicación</h2>
        </div>

        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Nombre de la aplicación</label>
            <input
              name="nombre_aplicacion"
              value={perfil.nombre_aplicacion || ''}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Descripción</label>
            <input
              name="descripcion"
              value={perfil.descripcion || ''}
              onChange={handleChange}
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Versión</label>
              <input
                name="version"
                value={perfil.version || ''}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Correo de soporte</label>
              <input
                name="contacto_soporte"
                value={perfil.contacto_soporte || ''}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              name="permitir_registro_sin_foto"
              checked={!!perfil.permitir_registro_sin_foto}
              onChange={handleChange}
              className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            Permitir registro de visitantes sin foto
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              name="politica_foto_requerida"
              checked={!!perfil.politica_foto_requerida}
              onChange={handleChange}
              className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            Política de foto requerida por defecto
          </label>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar perfil'}
          </button>

          {message && (
            <p className={`text-sm font-medium ${
              message.toLowerCase().includes('error') || message.toLowerCase().includes('no se pudo')
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
