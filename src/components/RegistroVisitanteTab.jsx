import { useState, useRef, useEffect } from 'react';
import { UserPlus, Camera, Calendar, Clock, MapPin, Phone, IdCard, FileText } from 'lucide-react';
import Webcam from 'react-webcam';
import { format } from 'date-fns';
import ApiService from '../services/api';

export default function RegistroVisitanteTab() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    fecha_visita: format(new Date(), 'yyyy-MM-dd'),
    hora_visita: format(new Date(), 'HH:mm'),
    validoHasta: '23:59',
    depart_visita: '',
    motivo: '',
    acepta_foto: true,
    observacion_privacidad: '',
    foto: null
  });

  const [showCamera, setShowCamera] = useState(false);
  const [fotoCaptured, setFotoCaptured] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [perfilApp, setPerfilApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);

  // Cargar departamentos al montar el componente
  useEffect(() => {
    cargarDepartamentos();
    cargarPerfilAplicacion();
  }, []);

  const cargarPerfilAplicacion = async () => {
    try {
      const response = await ApiService.obtenerPerfilActual();
      setPerfilApp(response);
    } catch (err) {
      console.error('Error al cargar perfil de aplicacion:', err);
      setPerfilApp(null);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const response = await ApiService.obtenerDepartamentos();
      setDepartamentos(response.results || response);
    } catch (err) {
      console.error('Error al cargar departamentos:', err);
      // Usar datos de respaldo si falla
      setDepartamentos([
        { codigo: 'A-101' },
        { codigo: 'A-102' },
        { codigo: 'A-201' },
        { codigo: 'B-101' },
        { codigo: 'B-201' },
        { codigo: 'B-205' }
      ]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const capturarFoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    setFotoCaptured(imageSrc);
    setFormData(prev => ({ ...prev, foto: imageSrc }));
    setShowCamera(false);
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      fecha_visita: format(new Date(), 'yyyy-MM-dd'),
      hora_visita: format(new Date(), 'HH:mm'),
      validoHasta: '23:59',
      depart_visita: '',
      motivo: '',
      acepta_foto: true,
      observacion_privacidad: '',
      foto: null
    });
    setFotoCaptured(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (perfilApp?.politica_foto_requerida && !formData.acepta_foto) {
      alert('La politica actual requiere foto para registrar visitantes.');
      return;
    }
    
    if (formData.acepta_foto && !formData.foto) {
      alert('Por favor, capture una foto del visitante');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar datos para enviar al backend
      const visitanteData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        motivo: formData.motivo || '',
        fecha_visita: formData.fecha_visita,
        hora_visita: formData.hora_visita,
        depart_visita: formData.depart_visita,
        acepta_foto: formData.acepta_foto,
        observacion_privacidad: formData.acepta_foto ? '' : (formData.observacion_privacidad || 'Visitante no autoriza captura de foto.'),
        foto: formData.acepta_foto ? formData.foto : null
      };

      const response = await ApiService.registrarVisitante(visitanteData);
      
      console.log('Visitante registrado:', response);
      alert('✅ Visitante registrado exitosamente');
      limpiarFormulario();
    } catch (err) {
      console.error('Error al registrar visitante:', err);
      setError(err.message || 'Error al registrar visitante');
      alert('❌ Error al registrar visitante: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-200">Registro de Visitante</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Juan"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  placeholder="Ej: Pérez"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* DNI / Identificación */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  DNI / Identificación *
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    name="dni"
                    placeholder="Ej: 12345678"
                    value={formData.dni}
                    onChange={handleInputChange}
                    maxLength={8}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: +51 999 999 999"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Departamento a Visitar */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Departamento a Visitar *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    name="depart_visita"
                    value={formData.depart_visita}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona departamento</option>
                    {departamentos.map((depto, index) => (
                      <option key={index} value={depto.codigo}>
                        {depto.codigo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas Adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notas Adicionales
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <textarea
                    name="motivo"
                    placeholder="Ej: Visitante frecuente, entrega de paquete, etc."
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de Visita
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      name="fecha_visita"
                      value={formData.fecha_visita}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hora
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="time"
                      name="hora_visita"
                      value={formData.hora_visita}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Válido Hasta
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="time"
                      name="validoHasta"
                      value={formData.validoHasta}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hora
                  </label>
                  <input
                    type="text"
                    value={formData.validoHasta}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-700 rounded-lg px-4 py-2.5 text-gray-400"
                  />
                </div>
              </div>

              {/* Foto del Visitante */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Foto del Visitante *
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                  <input
                    type="checkbox"
                    checked={!formData.acepta_foto}
                    disabled={!!perfilApp?.politica_foto_requerida}
                    onChange={(e) => {
                      const noAcepta = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        acepta_foto: !noAcepta,
                        foto: noAcepta ? null : prev.foto,
                      }));
                      if (noAcepta) {
                        setFotoCaptured(null);
                        setShowCamera(false);
                      }
                    }}
                  />
                  El visitante no autoriza que se le tome foto.
                </label>

                {perfilApp?.politica_foto_requerida && (
                  <p className="text-amber-400 text-xs mb-2">Politica activa: la foto es obligatoria.</p>
                )}

                {!formData.acepta_foto && (
                  <textarea
                    name="observacion_privacidad"
                    placeholder="Observación de privacidad (opcional)"
                    value={formData.observacion_privacidad}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 mb-3"
                  />
                )}
                
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center bg-slate-800/50">
                  {!formData.acepta_foto ? (
                    <div className="text-gray-400 text-sm">Registro sin foto autorizado por el visitante.</div>
                  ) : (
                    showCamera ? (
                      <div className="space-y-4">
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          className="w-full rounded-lg"
                          videoConstraints={{
                            width: 640,
                            height: 480,
                            facingMode: "user"
                          }}
                        />
                        <button
                          type="button"
                          onClick={capturarFoto}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          📸 Capturar Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCamera(false)}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : fotoCaptured ? (
                      <div className="space-y-4">
                        <img
                          src={fotoCaptured}
                          alt="Foto capturada"
                          className="w-full rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          📸 Tomar Nueva Foto
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm mb-4">
                          Captura la foto del visitante para el reconocimiento facial
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Tomar Foto
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-dark-border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Registrando...' : 'Registrar Visitante'}
            </button>
            
            <button
              type="button"
              onClick={limpiarFormulario}
              disabled={loading}
              className="px-8 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mt-6">
        <p className="text-gray-400 text-sm">
          Los listados de visitantes recientes y visitas frecuentes ahora están en la pestaña Opciones.
        </p>
      </div>
    </div>
  );
}
