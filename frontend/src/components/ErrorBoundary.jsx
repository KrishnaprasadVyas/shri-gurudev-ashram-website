import { Component } from "react";
import i18n from "../i18n";

/**
 * ErrorBoundary component to catch and handle React rendering errors
 * Prevents the entire app from crashing with a white screen
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });

    // In production, you could send this to an error reporting service
    // Example: reportErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>{i18n.t("error.somethingWrong")}</h1>
            <p style={styles.message}>{i18n.t("error.apology")}</p>

            {/* Show error details only in development */}
            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>
                  {i18n.t("error.errorDetails")}
                </summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.buttonContainer}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                {i18n.t("error.reloadPage")}
              </button>
              <button
                onClick={this.handleGoHome}
                style={styles.secondaryButton}
              >
                {i18n.t("error.goHome")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    padding: "1rem",
  },
  content: {
    textAlign: "center",
    maxWidth: "500px",
    padding: "2rem",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  icon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "0.5rem",
  },
  message: {
    color: "#6b7280",
    marginBottom: "1.5rem",
  },
  details: {
    textAlign: "left",
    marginBottom: "1.5rem",
    backgroundColor: "#fef2f2",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },
  summary: {
    cursor: "pointer",
    fontWeight: "500",
    color: "#dc2626",
  },
  errorText: {
    marginTop: "0.5rem",
    fontSize: "0.75rem",
    color: "#7f1d1d",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "200px",
    overflow: "auto",
  },
  buttonContainer: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "1rem",
  },
  secondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default ErrorBoundary;
