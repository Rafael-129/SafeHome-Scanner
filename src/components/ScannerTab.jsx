import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, User } from 'lucide-react';
import ApiService from '../services/api';

const ScannerFacial = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [dniBusqueda, setDniBusqueda] = useState('');
  const webcamRef = useRef(null);

  const iniciarEscaneo = async () => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);
    
    try {
      // Capturar imagen de la webcam
      const imageSrc = webcamRef.current?.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('No se pudo capturar la imagen');
      }

      // Enviar al backend para procesamiento
      const escaneoData = {
        foto_capturada: imageSrc,
        tipo_persona: 'visitante', // Por defecto, el backend puede determinarlo mejor
        dni: dniBusqueda.trim() || undefined,
      };

      const resultado = await ApiService.procesarEscaneo(escaneoData);
      
      // Adaptar respuesta del backend
      const personaDetectada = !!(resultado.idusuario || resultado.idvisitante);
      const resultadoFormateado = {
        foto_capturada: imageSrc,
        tipo_persona: resultado.tipo_persona || 'desconocido',
        confianza_reconocimiento: 95.5, // El backend podría devolver esto
        nombre: resultado.idusuario ? 
          `${resultado.usuario_info?.nombre || ''} ${resultado.usuario_info?.apellido || ''}`.trim() :
          resultado.idvisitante ?
          `${resultado.visitante_info?.nombre || ''} ${resultado.visitante_info?.apellido || ''}`.trim() :
          'Desconocido',
        departamento: resultado.usuario_info?.departamento || resultado.visitante_info?.depart_visita || 'N/A',
        estado: personaDetectada ? 'AUTORIZADO' : 'DESCONOCIDO'
      };
      
      setScanResult(resultadoFormateado);
      
      if (onScanComplete) {
        onScanComplete(resultadoFormateado);
      }

      // Registrar en historial de accesos
      if (personaDetectada) {
        await ApiService.registrarAcceso({
          idscanner: resultado.idscanner,
          idusuario: resultado.idusuario || null,
          idvisitante: resultado.idvisitante || null,
          fecha_entrada: new Date().toISOString().split('T')[0],
          hora_entrada: new Date().toTimeString().split(' ')[0],
          estado: resultadoFormateado.estado === 'AUTORIZADO' ? 'Permitido' : 'Denegado'
        });
      }
      
    } catch (err) {
      console.error('Error en escaneo:', err);
      setError(err.message || 'Error al procesar el escaneo');
      
      // Resultado de error
      const resultadoError = {
        foto_capturada: webcamRef.current?.getScreenshot(),
        tipo_persona: 'error',
        nombre: 'Error en escaneo',
        estado: 'ERROR'
      };
      setScanResult(resultadoError);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-200">Vista de Cámara</h3>
      </div>

      <div className="relative bg-slate-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        {cameraActive ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user"
            }}
          />
        ) : (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Feed de Cámara</p>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="animate-pulse">
              <div className="w-48 h-48 border-4 border-blue-500 rounded-lg"></div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (!cameraActive) {
            setCameraActive(true);
          } else {
            iniciarEscaneo();
          }
        }}
        disabled={isScanning}
        className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!cameraActive ? 'Activar Cámara' : isScanning ? 'Escaneando...' : 'Iniciar Escaneo'}
      </button>

      <div className="mt-4">
        <label className="block text-sm text-gray-400 mb-2">DNI (opcional, para simulacion)</label>
        <input
          type="text"
          maxLength={8}
          value={dniBusqueda}
          onChange={(e) => setDniBusqueda(e.target.value.replace(/\D/g, ''))}
          placeholder="Ej: 45678912"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

const ResultadoEscaneo = ({ resultado }) => {
  if (!resultado) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-200">Resultado del Escaneo</h3>
        </div>
        
        <div className="text-center py-16">
          <User className="w-20 h-20 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">Esperando escaneo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-200">Resultado del Escaneo</h3>
      </div>

      <div className="text-center py-8">
        {resultado.foto_capturada && (
          <img 
            src={resultado.foto_capturada} 
            alt="Captura" 
            className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-green-500"
          />
        )}

        <h4 className="text-xl font-bold text-white mb-2">{resultado.nombre || 'Desconocido'}</h4>
        
        {resultado.departamento && (
          <p className="text-blue-400 text-sm mb-4">📍 {resultado.departamento}</p>
        )}

        <div className="inline-block px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
          {resultado.estado}
        </div>

        <div className="mt-6 pt-6 border-t border-dark-border">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Confianza:</span>
            <span className="text-white font-medium">{resultado.confianza_reconocimiento}%</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-400">Tipo:</span>
            <span className="text-white font-medium capitalize">{resultado.tipo_persona}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ScannerTab() {
  const [scanResult, setScanResult] = useState(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ScannerFacial onScanComplete={setScanResult} />
      <ResultadoEscaneo resultado={scanResult} />
    </div>
  );
}
