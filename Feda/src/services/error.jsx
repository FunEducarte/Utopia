import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la interfaz de reserva
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("ErrorBoundary atrapó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier interfaz de reserva
      return <h1>Algo salió mal.</h1>;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
