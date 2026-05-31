import { useState, useEffect } from 'react';
import { Scan, UserPlus, History, UserCircle, SlidersHorizontal, Sun, Moon, Menu, X } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import ScannerTab from './components/ScannerTab';
import RegistroVisitanteTab from './components/RegistroVisitanteTab';
import HistorialAccesosTab from './components/HistorialAccesosTab';
import PerfilTab from './components/PerfilTab';
import HistorialVisitantes from './components/HistorialVisitantes';

const tabs = [
  { id: 'scanner', label: 'Scanner', icon: Scan },
  { id: 'registro', label: 'Registrar', icon: UserPlus },
  { id: 'historial', label: 'Registro Accesos', icon: History },
  { id: 'historial-visitantes', label: 'Hist. Visitantes', icon: SlidersHorizontal },
  { id: 'perfil', label: 'Perfil', icon: UserCircle }
];

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Estado para el Tema
  const [isDark, setIsDark] = useState(true);
  
  // Estado para el Menú Hamburguesa en móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Efecto para cambiar la clase 'dark' en el <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
        
        {/* Header Responsive */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            
            <div className="flex items-center gap-3">
              {/* Hamburger Button (Mobile only) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-gray-300 transition"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                  SafeHome
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  Control de Acceso Facial
                </p>
              </div>
            </div>
            
            {/* Botón Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 lg:p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition text-slate-700 dark:text-yellow-400"
              title="Cambiar tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* --- Menú Hamburguesa Desplegable (Solo Móvil) --- */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <nav className="flex flex-col px-4 pt-2 pb-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false); // Cierra el menú al seleccionar
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-slate-700'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* --- Navigation Tabs (Escritorio / Tablets) --- */}
        <div className="hidden md:block bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
          <div className="max-w-7xl mx-auto">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-4 font-medium whitespace-nowrap transition-colors relative focus:outline-none ${
                      isActive
                        ? 'text-blue-600 dark:text-white bg-gray-50 dark:bg-slate-900'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
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

        {/* Content principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === 'scanner' && <ScannerTab />}
          {activeTab === 'registro' && <RegistroVisitanteTab />}
          {activeTab === 'historial' && <HistorialAccesosTab />}
          {activeTab === 'perfil' && <PerfilTab />}
          {activeTab === 'historial-visitantes' && <HistorialVisitantes />}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto px-6 py-4 text-center text-gray-400 dark:text-gray-500 text-sm">
            SafeHome v1.0 - 2025
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}

export default App;
