import { useEffect, useState } from "react";

const API_URL = "http://localhost:4000/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("admin@viek.test");
  const [password, setPassword] = useState("password123");
  
  // FIX: Initialize arrays properly to prevent .map() crashes on first render
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]); 
  
  const [selectedClient, setSelectedClient] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [message, setMessage] = useState("");

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setClients([]);
    setProjects([]);
    setMessage("Logged out successfully.");
  }

  // Helper function to handle 401 Unauthorized responses globally
  function handleUnauthorized(response) {
    if (response.status === 401) {
      logout();
      setMessage("Session expired. Please log in again.");
      return true;
    }
    return false;
  }

  async function login(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Login failed");
        return;
      }

      localStorage.setItem("token", result.token);
      setToken(result.token);
      setMessage(""); // Clear messages on successful login
    } catch (error) {
      setMessage("Network error. Could not connect to the server.");
    }
  }

  async function loadClients() {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (handleUnauthorized(response)) return;

      const result = await response.json();
      
      // FIX: The backend returns `{ data: clients }`, not `{ clients: clients }`
      setClients(result.data || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  }

  async function loadProjects() {
    try {
      const url = selectedClient
        ? `${API_URL}/projects?clientId=${selectedClient}`
        : `${API_URL}/projects`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (handleUnauthorized(response)) return;

      const result = await response.json();
      setProjects(result.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }

  async function addClient(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json" // FIX: Added missing Content-Type header
        },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail
        })
      });

      const result = await response.json();

      if (handleUnauthorized(response)) return;

      if (!response.ok) {
        setMessage(result.message);
        return;
      }

      setMessage("Client added successfully");
      setClientName("");
      setClientEmail("");
      loadClients();
    } catch (error) {
      setMessage("Network error while adding client.");
    }
  }

  async function deleteClient(id) {
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (handleUnauthorized(response)) return;

      setMessage(result.message);

      if (response.ok) {
        // FIX: If we delete the client we are currently filtering by, reset the filter
        if (Number(selectedClient) === id) {
          setSelectedClient("");
        }
        loadClients();
        loadProjects(); // Reload projects to reflect deleted client's projects
      }
    } catch (error) {
      setMessage("Network error while deleting client.");
    }
  }

  useEffect(() => {
    if (token) {
      loadClients();
      loadProjects();
    }
  }, [token, selectedClient]);

  if (!token) {
    return (
      <div className="container">
        <div className="card">
          <h1>VIEK Client Management</h1>
          <h2>Login</h2>

          <form onSubmit={login}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <button type="submit">Login</button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>VIEK Client Management</h1>
        <button onClick={logout} style={{ background: "#dc3545", color: "white" }}>Logout</button>
      </div>

      <div className="card">
        <h2>Add Client</h2>
        <form onSubmit={addClient}>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            required
          />
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Client email"
            required
          />
          <button type="submit">Add Client</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="card">
        <h2>Clients</h2>
        {clients.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          <ul>
            {clients.map((client) => (
              <li key={client.id}>
                <div>
                  <strong>{client.name}</strong>
                  <span style={{ marginLeft: "10px", color: "#666" }}>{client.email}</span>
                </div>
                <button onClick={() => deleteClient(client.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Projects</h2>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          <option value="">All Clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <ul>
          {projects.length === 0 ? (
            <p style={{ marginTop: "15px" }}>No projects found for this client.</p>
          ) : (
            projects.map((project) => (
              <li key={project.id}>
                <strong>{project.name}</strong>
                <span>Client ID: {project.clientId}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;