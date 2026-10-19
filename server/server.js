import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
app.use(express.json());

const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@viek.test",
    password: "password123"
  }
];

let clients = [
  {
    id: 1,
    name: "Acme Limited",
    email: "contact@acme.test"
  },
  {
    id: 2,
    name: "Bright Solutions",
    email: "hello@bright.test"
  }
];

let projects = [
  {
    id: 1,
    name: "Website Development",
    clientId: 1
  },
  {
    id: 2,
    name: "Mobile Application",
    clientId: 2
  },
  {
    id: 3,
    name: "UI/UX Design",
    clientId: 1
  }
];

// Login
app.post("/api/login", (req, res) => {
  const email = req.body?.email?.trim();
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  // Exclude sensitive password field from response payload
  const { password: _, ...safeUser } = user;

  res.json({
    token: "demo-token",
    user: safeUser
  });
});

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== "Bearer demo-token") {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  next();
}

// Get clients
app.get("/api/clients", authenticate, (req, res) => {
  res.json({
    data: clients
  });
});

// Add client
app.post("/api/clients", authenticate, (req, res) => {
  const name = req.body?.name?.trim();
  const email = req.body?.email?.trim();

  if (!name || !email) {
    return res.status(400).json({
      message: "Name and email are required"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please provide a valid email address"
    });
  }

  const emailExists = clients.some(
    (client) => client.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    return res.status(409).json({
      message: "A client with this email already exists"
    });
  }

  const nextId =
    clients.length > 0
      ? Math.max(...clients.map((c) => c.id)) + 1
      : 1;

  const newClient = {
    id: nextId,
    name,
    email
  };

  clients.push(newClient);

  res.status(201).json({
    data: newClient
  });
});

// Delete client
app.delete("/api/clients/:id", authenticate, (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({
      message: "Invalid client ID"
    });
  }

  const originalLength = clients.length;

  clients = clients.filter(
    (client) => client.id !== id
  );

  if (clients.length === originalLength) {
    return res.status(404).json({
      message: "Client not found"
    });
  }

  // Remove projects belonging to the deleted client
  projects = projects.filter(
    (project) => project.clientId !== id
  );

  res.json({
    message: "Client deleted successfully"
  });
});

// Get projects
app.get("/api/projects", authenticate, (req, res) => {
  const { clientId } = req.query;

  let result = projects;

  if (clientId) {
    const parsedClientId = Number(clientId);
    result = projects.filter(
      (project) => project.clientId === parsedClientId
    );
  }

  res.json({
    projects: result
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON payload"
    });
  }

  res.status(500).json({
    message: "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});