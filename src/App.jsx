import { useState } from 'react';
import { Scan, UserPlus, History, UserCircle, SlidersHorizontal } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import ScannerTab from './components/ScannerTab';
import RegistroVisitanteTab from './components/RegistroVisitanteTab';
import HistorialAccesosTab from './components/HistorialAccesosTab';
import PerfilTab from './components/PerfilTab';
import HistorialVisitantes from './components/HistorialVisitantes';

const tabs = [
  { id: 'scanner', label: 'Scanner Facial', icon: Scan },
  { id: 'registro', label: 'Registro Visitante', icon: UserPlus },
  { id: 'historial', label: 'Historial Accesos', icon: History },
  { id: 'historial-visitantes', label: 'Historial de Visitantes', icon: SlidersHorizontal },
  { id: 'perfil', label: 'Perfil Aplicacion', icon: UserCircle }
];

function App() {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <AppProvider>
      <div className="min-h-screen bg-dark-bg flex flex-col">
        {/* Header */}
        <header className="bg-dark-card border-b border-dark-border">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              Sistema de Control de Acceso
            </h1>
            <p className="text-gray-400 text-sm">
              Reconocimiento Facial - Condominios
            </p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-dark-card border-b border-dark-border">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                      isActive
                        ? 'text-white bg-dark-bg'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {activeTab === 'scanner' && <ScannerTab />}
          {activeTab === 'registro' && <RegistroVisitanteTab />}
          {activeTab === 'historial' && <HistorialAccesosTab />}
          {activeTab === 'perfil' && <PerfilTab />}
          {activeTab === 'historial-visitantes' && <HistorialVisitantes />}
        </main>

        {/* Footer */}
        <footer className="bg-dark-card border-t border-dark-border mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-4 text-center text-gray-500 text-sm">
            Sistema de Control de Acceso v1.0 - 2025
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
