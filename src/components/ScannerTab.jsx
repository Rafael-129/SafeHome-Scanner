import { useState, useEffect, useRef } from 'react';
import { Camera, User, CheckCircle, XCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import ApiService from '../services/api';

// ── Sonidos ──────────────────────────────────────────────────────────────────
const reproducirSonido = (tipo) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'exito') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(147, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.error('Error al reproducir audio:', e);
  }
};

// ── Panel izquierdo: foto capturada por la Pi ─────────────────────────────
const PanelCamara = ({ fotoUrl, conectado, ultimaActualizacion }) => (
  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Camera className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
          Cámara SafeHome
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {conectado ? (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Wifi className="w-3 h-3" /> En línea
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <WifiOff className="w-3 h-3" /> Sin datos
          </span>
        )}
      </div>
    </div>

    <div className="relative bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-transparent transition-colors" style={{ height: '500px' }}>
      {true ? (
        <img
          src="http://192.168.1.14:8080/video"
          alt="Stream en vivo de la Pi"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Esperando captura de la Raspberry Pi...</p>
          <p className="text-gray-400 text-xs mt-1">El sistema escaneará automáticamente</p>
        </div>
      )}

      {/* Badge de tiempo real */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        En vivo
      </div>

      {ultimaActualizacion && (
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {ultimaActualizacion}
        </div>
      )}
    </div>

    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
      Las fotos son capturadas automáticamente por la Raspberry Pi en la entrada
    </p>
  </div>
);

// ── Panel derecho: resultado del último acceso ────────────────────────────
const PanelResultado = ({ acceso }) => {
  if (!acceso) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
            Último Acceso
          </h3>
        </div>
        <div className="text-center py-16">
          <User className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-500">Sin registros aún</p>
          <p className="text-gray-400 text-xs mt-1">El resultado aparecerá aquí automáticamente</p>
        </div>
      </div>
    );
  }

  const esPermitido = acceso.estado === 'Permitido';
  const nombre = acceso.usuario_info
    ? `${acceso.usuario_info.nombre} ${acceso.usuario_info.apellido}`
    : acceso.visitante_info
    ? `${acceso.visitante_info.nombre} ${acceso.visitante_info.apellido}`
    : 'Desconocido';

  const departamento = acceso.usuario_info?.departamento || 'Visitante';
  const foto = acceso.scanner_info?.foto_capturada || null;

  return (
    <div className={`bg-white dark:bg-slate-800 border-2 rounded-lg p-6 shadow-sm transition-all ${
      esPermitido
        ? 'border-green-400 dark:border-green-500'
        : 'border-red-400 dark:border-red-500'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">
            Último Acceso
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs text-gray-400">Auto</span>
        </div>
      </div>

      <div className="text-center py-4">
        {/* Foto de la persona */}
        <div className={`w-60 h-60 rounded-xl mx-auto mb-4 overflow-hidden border-4 ${
          esPermitido ? 'border-green-400' : 'border-red-400'
        }`}>
          {foto ? (
            <img src={foto} alt={nombre} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              esPermitido ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <User className={`w-10 h-10 ${esPermitido ? 'text-green-500' : 'text-red-400'}`} />
            </div>
          )}
        </div>

        {/* Nombre */}
        <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{nombre}</h4>
        <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">📍 {departamento}</p>

        {/* Badge de estado */}
        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-4 ${
          esPermitido
            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
        }`}>
          {esPermitido
            ? <><CheckCircle className="w-4 h-4" /> ACCESO PERMITIDO</>
            : <><XCircle className="w-4 h-4" /> ACCESO DENEGADO</>
          }
        </div>

        {/* Detalles */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
            <span className="text-slate-800 dark:text-white font-medium">{acceso.fecha_entrada}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Hora:</span>
            <span className="text-slate-800 dark:text-white font-medium">{acceso.hora_entrada}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
            <span className="text-slate-800 dark:text-white font-medium capitalize">
              {acceso.usuario_info ? 'Residente' : 'Visitante'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────
export default function ScannerTab() {
  const [ultimoAcceso, setUltimoAcceso] = useState(null);
  const [ultimoIdHistorial, setUltimoIdHistorial] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const intervalRef = useRef(null);

  const fetchUltimoAcceso = async () => {
    try {
      const data = await ApiService.obtenerHistorialAccesos({ page: 1 });
      const resultados = data?.results || [];

      if (resultados.length === 0) return;

      const ultimo = resultados[0]; // El más reciente

      // Solo actualizar si hay uno nuevo
      if (ultimo.idhistorial !== ultimoIdHistorial) {
        setUltimoAcceso(ultimo);
        setUltimoIdHistorial(ultimo.idhistorial);
        setConectado(true);

        // Reproducir sonido según estado
        if (ultimo.estado === 'Permitido') {
          reproducirSonido('exito');
        } else if (ultimo.estado === 'Denegado') {
          reproducirSonido('error');
        }

        // Actualizar hora
        const ahora = new Date();
        setUltimaActualizacion(ahora.toLocaleTimeString('es-PE'));
      }
    } catch (err) {
      console.error('Error al obtener historial:', err);
      setConectado(false);
    }
  };

  useEffect(() => {
    // Primera carga inmediata
    fetchUltimoAcceso();

    // Polling cada 3 segundos
    intervalRef.current = setInterval(fetchUltimoAcceso, 3000);

    return () => clearInterval(intervalRef.current);
  }, [ultimoIdHistorial]);

  // Obtener foto de la última captura del scanner
  const fotoCapturada = ultimoAcceso?.scanner_info?.foto_capturada || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PanelCamara
        fotoUrl={fotoCapturada}
        conectado={conectado}
        ultimaActualizacion={ultimaActualizacion}
      />
      <PanelResultado acceso={ultimoAcceso} />
    </div>
  );
}
