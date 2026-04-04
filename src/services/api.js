// API Service - Integrado con Django REST Framework

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  /**
   * Realiza una petición HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...options.headers,
    };

    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok) {
        const errorData = contentType.includes('application/json')
          ? await response.json().catch(() => ({}))
          : await response.text().catch(() => '');
        console.error('Error del servidor:', errorData);
        throw new Error(
          typeof errorData === 'string'
            ? (errorData || 'Error en la petición')
            : (JSON.stringify(errorData) || 'Error en la petición')
        );
      }

      if (response.status === 204) {
        return null;
      }

      if (contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error('Error en petición API:', error);
      throw error;
    }
  }

  // ============ SCANNER ============
  async procesarEscaneo(data) {
    return this.request('/scanner/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async obtenerEscaneos(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.request(`/scanner/?${params}`);
  }

  async obtenerEscaneosRecientes() {
    return this.request('/scanner/recientes/');
  }

  // ============ VISITANTES ============
  async registrarVisitante(visitante) {
    return this.request('/visitantes/', {
      method: 'POST',
      body: JSON.stringify(visitante),
    });
  }

  async obtenerVisitantes(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.request(`/visitantes/?${params}`);
  }

  async obtenerVisitante(id) {
    return this.request(`/visitantes/${id}/`);
  }

  async actualizarVisitante(id, data) {
    return this.request(`/visitantes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarVisitante(id) {
    return this.request(`/visitantes/${id}/`, {
      method: 'DELETE',
    });
  }

  async obtenerVisitantesHoy() {
    return this.request('/visitantes/hoy/');
  }

  // ============ USUARIOS (RESIDENTES) ============
  async obtenerUsuarios(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.request(`/usuarios/?${params}`);
  }

  async obtenerUsuario(id) {
    return this.request(`/usuarios/${id}/`);
  }

  async buscarUsuarioPorDNI(dni) {
    return this.request(`/usuarios/buscar_por_dni/?dni=${dni}`);
  }

  // ============ HISTORIAL ACCESOS ============
  async obtenerHistorialAccesos(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.request(`/historial/?${params}`);
  }

  async registrarAcceso(acceso) {
    return this.request('/historial/', {
      method: 'POST',
      body: JSON.stringify(acceso),
    });
  }

  async obtenerHistorialHoy() {
    return this.request('/historial/hoy/');
  }

  async obtenerAccesosActivos() {
    return this.request('/historial/activos/');
  }

  async obtenerEstadisticas(fechaDesde, fechaHasta) {
    return this.request(`/historial/estadisticas/?desde=${fechaDesde}&hasta=${fechaHasta}`);
  }

  // ============ DEPARTAMENTOS ============
  async obtenerDepartamentos(filtros = {}) {
    const params = new URLSearchParams(filtros);
    return this.request(`/departamentos/?${params}`);
  }

  async obtenerDepartamento(id) {
    return this.request(`/departamentos/${id}/`);
  }

  // ============ UPLOAD DE ARCHIVOS ============
  async subirFoto(file, tipo = 'visitante') {
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('tipo', tipo);

    return this.request('/upload/foto', {
      method: 'POST',
      headers: {}, // Dejar que el navegador establezca Content-Type para FormData
      body: formData,
    });
  }
}

export default new ApiService();
