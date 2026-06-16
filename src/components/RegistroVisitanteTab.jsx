import { useState, useRef, useEffect } from 'react';
import { UserPlus, Camera, Calendar, Clock, MapPin, Phone, IdCard, FileText, ShieldCheck, X } from 'lucide-react';
import Webcam from 'react-webcam';
import { format } from 'date-fns';
import ApiService from '../services/api';
import { TERMINOS_TITULO, TERMINOS_TEXTO, RETENCION_DIAS } from '../constants/terminos';

const analizarCalidadFoto = (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 75;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let totalLuminance = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += luminance;
        }
        
        const numPixels = data.length / 4;
        const avgBrightness = totalLuminance / numPixels;
        
        let sumSqDiff = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const diff = luminance - avgBrightness;
          sumSqDiff += diff * diff;
        }
        const contrast = Math.sqrt(sumSqDiff / numPixels);
        
        let esApta = true;
        let mensaje = '✅ Foto apta para reconocimiento facial';
        
        if (avgBrightness < 50) {
          esApta = false;
          mensaje = '⚠️ Foto muy oscura. Acerque una luz o mejore la iluminación.';
        } else if (avgBrightness > 215) {
          esApta = false;
          mensaje = '⚠️ Foto sobreexpuesta. Evite la luz directa del sol o focos fuertes.';
        } else if (contrast < 20) {
          esApta = false;
          mensaje = '⚠️ Imagen borrosa o con muy bajo contraste.';
        }
        
        resolve({ esApta, brillo: Math.round(avgBrightness), contraste: Math.round(contrast), mensaje });
      } catch {
        resolve({ esApta: true, mensaje: 'Calidad de imagen aceptable' });
      }
    };
    img.onerror = () => {
      resolve({ esApta: true, mensaje: 'Error al verificar imagen' });
    };
  });
};

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
    acepta_terminos: false,
    foto: null
  });

  const [showTerminos, setShowTerminos] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [fotoCaptured, setFotoCaptured] = useState(null);
  const [calidadFoto, setCalidadFoto] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [perfilApp, setPerfilApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

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

    if (imageSrc) {
      analizarCalidadFoto(imageSrc).then((res) => {
        setCalidadFoto(res);
      });
    }
  };

  const cargarFotoDesdeArchivo = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, seleccione un archivo de imagen válido.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageSrc = reader.result;
      setFotoCaptured(imageSrc);
      setFormData(prev => ({ ...prev, foto: imageSrc }));
      setShowCamera(false);

      if (imageSrc) {
        analizarCalidadFoto(imageSrc).then((res) => {
          setCalidadFoto(res);
        });
      }
    };

    reader.onerror = () => {
      alert('No fue posible leer la imagen seleccionada.');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
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
      acepta_terminos: false,
      foto: null
    });
    setFotoCaptured(null);
    setCalidadFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.acepta_terminos) {
      alert('Debe aceptar los términos y condiciones de tratamiento de datos para registrar al visitante.');
      return;
    }

    if (perfilApp?.politica_foto_requerida && !formData.acepta_foto) {
      alert('La politica actual requiere foto para registrar visitantes.');
      return;
    }
    
    if (formData.acepta_foto && !formData.foto) {
      alert('Por favor, capture una foto del visitante');
      return;
    }

    if (formData.acepta_foto && calidadFoto && !calidadFoto.esApta) {
      const continuar = window.confirm('⚠️ La calidad de la foto no es óptima (puede ser muy oscura o borrosa). ¿Desea registrar al visitante de todas formas?');
      if (!continuar) return;
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
        acepta_terminos: formData.acepta_terminos,
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
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-200">Registro de Visitante</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Juan"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  placeholder="Ej: Pérez"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* DNI / Identificación */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  DNI / Identificación *
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    name="dni"
                    placeholder="Ej: 12345678"
                    value={formData.dni}
                    onChange={handleInputChange}
                    maxLength={8}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    name="telefono"
                    placeholder="Ej: +51 999 999 999"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Departamento a Visitar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Departamento a Visitar *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <select
                    name="depart_visita"
                    value={formData.depart_visita}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Notas Adicionales
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <textarea
                    name="motivo"
                    placeholder="Ej: Visitante frecuente, entrega de paquete, etc."
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Fecha de Visita
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="date"
                      name="fecha_visita"
                      value={formData.fecha_visita}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Hora
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="time"
                      name="hora_visita"
                      value={formData.hora_visita}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Válido Hasta
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="time"
                      name="validoHasta"
                      value={formData.validoHasta}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Hora
                  </label>
                  <input
                    type="text"
                    value={formData.validoHasta}
                    readOnly
                    className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Foto del Visitante */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Foto del Visitante *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={cargarFotoDesdeArchivo}
                  className="hidden"
                />

                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 mb-3 cursor-pointer">
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
                    className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  El visitante no autoriza que se le tome foto.
                </label>

                {perfilApp?.politica_foto_requerida && (
                  <p className="text-amber-500 dark:text-amber-400 text-xs mb-2">Politica activa: la foto es obligatoria.</p>
                )}

                {!formData.acepta_foto && (
                  <textarea
                    name="observacion_privacidad"
                    placeholder="Observación de privacidad (opcional)"
                    value={formData.observacion_privacidad}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                )}
                
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
                  {!formData.acepta_foto ? (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">Registro sin foto autorizado por el visitante.</div>
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
                          className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition-colors"
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

                        {/* Indicador de calidad de la foto */}
                        {calidadFoto && (
                          <div className={`p-3 rounded-lg text-sm font-medium transition-colors text-left ${
                            calidadFoto.esApta 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <p className="font-semibold">{calidadFoto.mensaje}</p>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400 font-normal">
                              <span>Brillo: {calidadFoto.brillo}/255</span>
                              <span>Contraste: {calidadFoto.contraste}</span>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setShowCamera(true);
                            setCalidadFoto(null);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          📸 Tomar Nueva Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          🖼️ Subir otra foto
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Camera className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                          Captura la foto del visitante para el reconocimiento facial
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => setShowCamera(true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                          >
                            <Camera className="w-5 h-5" />
                            Tomar Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
                          >
                            🖼️ Subir Foto
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Términos y Condiciones (obligatorio) */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="acepta_terminos"
                checked={formData.acepta_terminos}
                onChange={(e) => setFormData((prev) => ({ ...prev, acepta_terminos: e.target.checked }))}
                className="mt-1 rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 dark:text-gray-300">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerminos(true)}
                  className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700"
                >
                  términos y condiciones
                </button>{' '}
                de tratamiento de datos personales. *
              </span>
            </label>
            <p className="flex items-center gap-1.5 mt-2 ml-7 text-xs text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              La foto se conserva un máximo de {RETENCION_DIAS} días y se elimina automáticamente.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
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
              className="px-8 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 mt-6 shadow-sm transition-colors">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Los listados de visitantes recientes y visitas frecuentes ahora están en la pestaña Opciones.
        </p>
      </div>

      {/* Modal de Términos y Condiciones */}
      {showTerminos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowTerminos(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">{TERMINOS_TITULO}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTerminos(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {TERMINOS_TEXTO}
              </p>
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTerminos(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, acepta_terminos: true }));
                  setShowTerminos(false);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Acepto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
