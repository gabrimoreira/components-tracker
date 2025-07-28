require("dotenv").config();
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();

const API_URL = process.env.API_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT_SERVER || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

function authenticateServer(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.clearCookie("token");
      return res.redirect("/login");
    }
    req.user = user;
    next();
  });
}

// Páginas públicas
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));
app.get("/sign-up", (req, res) => res.render("sign-up"));

// Autenticação
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return res.status(401).send("Credenciais inválidas");
  const user = await response.json();
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("token", token, { httpOnly: true });
  res.redirect(`/${user.profile}`);
});

app.post("/sign-up", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send("As senhas não coincidem.");
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      return res.status(response.status).send(`Erro ao registrar: ${errorMsg}`);
    }

 
    res.redirect("/login?status=success");

  } catch (error) {
    console.error('ERRO NO SIGN-UP (SERVER):', error);
    res.status(500).send('Não foi possível se conectar ao serviço de autenticação.');
  }
});
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Perfis
app.get("/student", authenticateServer, (req, res) => {
  if (req.user.profile !== "student")
    return res.status(403).send("Acesso negado.");
  res.render("student/index", { user: req.user });
});

app.get("/professor", authenticateServer, (req, res) => {
  if (req.user.profile !== "professor")
    return res.status(403).send("Acesso negado.");
  res.render("professor/index", { user: req.user });
});

app.get("/tecnico", authenticateServer, (req, res) => {
  if (req.user.profile !== "tecnico")
    return res.status(403).send("Acesso negado.");
  res.render("tecnico/index", { user: req.user });
});

// Componentes
app.get("/student/componentes/json", authenticateServer, async (req, res) => {
  const response = await fetch(`${API_URL}/componentes`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });

  if (!response.ok) {
    const msg = await response.text();
    return res.status(500).send(`Erro ao carregar componentes: ${msg}`);
  }

  const componentes = await response.json();
  res.json(componentes);
});

app.get("/:profile/componentes", authenticateServer, async (req, res) => {
  const response = await fetch(`${API_URL}/componentes`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });

  if (!response.ok) {
    const msg = await response.text();
    return res.status(500).send(`Erro ao carregar os componentes: ${msg}`);
  }

  const componentes = await response.json();
  res.render(`${req.user.profile}/componentes`, {
    user: req.user,
    componentes,
  });
});

app.get("/:profile/add-componentes", authenticateServer, (req, res) => {
  res.render(`${req.user.profile}/add-componentes`, { user: req.user });
});

app.post("/add-componentes", authenticateServer, async (req, res) => {
  await fetch(`${API_URL}/componentes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.cookies.token}`,
    },
    body: JSON.stringify(req.body),
  });
  res.redirect(`/${req.user.profile}/componentes`);
});

app.get("/tecnico/componentes/json", authenticateServer, async (req, res) => {
  if (req.user.profile !== "tecnico") {
    return res.status(403).send("Acesso negado.");
  }

  const response = await fetch(`${API_URL}/componentes`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });

  if (!response.ok) {
    return res.status(500).send(`Erro ao carregar componentes da API.`);
  }

  const componentes = await response.json();
  res.json(componentes);
});

app.get("/professor/componentes/json", authenticateServer, async (req, res) => {
  if (req.user.profile !== "professor")
    return res.status(403).send("Acesso negado.");
  const response = await fetch(`${API_URL}/componentes`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });
  const data = await response.json();
  res.json(data);
});
app.get("/professor/add-componentes", authenticateServer, (req, res) => {
  res.render("professor/add-componentes", { user: req.user });
});

// Turmas
app.get('/student/turmas/json', authenticateServer, async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/turmas`, {
      headers: { Authorization: `Bearer ${req.cookies.token}` }
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error(`Erro da API ao buscar turmas: ${errorMsg}`);
      return res.status(response.status).json({ error: errorMsg });
    }

    const turmas = await response.json();
    res.json(turmas);
    
  } catch (error) {
    console.error("ERRO DE CONEXÃO COM A API:", error);
    res.status(500).json({ error: "Não foi possível conectar ao serviço de turmas." });
  }
});

app.get("/student/turmas", authenticateServer, async (req, res) => {
  const response = await fetch(`${API_URL}/turmas`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });
  const data = await response.json();
  res.render("student/turmas", { user: req.user, ...data });
});

app.post("/student/turmas", authenticateServer, async (req, res) => {
  await fetch(`${API_URL}/turmas/inscrever`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.cookies.token}`,
    },
    body: JSON.stringify({ turmaId: req.body.turmaId }),
  });
  res.redirect("/student/turmas");
});

app.get('/professor/turmas/json', authenticateServer, async (req, res) => {
    if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
    const response = await fetch(`${API_URL}/turmas/professor/${req.user.id}`, { headers: { Authorization: `Bearer ${req.cookies.token}` } });
    const data = await response.json();
    res.json(data);
});

app.get('/professor/turmas', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  
  const response = await fetch(`${API_URL}/turmas/professor/${req.user.id}`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` }
  });
  const turmas = await response.json();
  res.render('professor/turmas', { user: req.user, turmas });
});

app.get('/professor/turmas/add', authenticateServer, (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  res.render('professor/add-turma', { user: req.user });
});

app.post('/professor/turmas', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  
  await fetch(`${API_URL}/turmas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.cookies.token}` },
    body: JSON.stringify(req.body)
  });
  res.redirect('/professor/turmas');
});

app.get('/professor/turmas/:id/edit', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  
  const response = await fetch(`${API_URL}/turmas/${req.params.id}`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` }
  });
  if (!response.ok) return res.status(404).send('Turma não encontrada.');
  
  const turma = await response.json();
  res.render('professor/edit-turma', { user: req.user, turma });
});

app.post('/professor/turmas/:id/edit', authenticateServer, async (req, res) => {
    if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");


    let alunosIds = req.body.alunosIds || [];
    if (!Array.isArray(alunosIds)) {
        alunosIds = [alunosIds];
    }
    alunosIds = alunosIds.map(id => parseInt(id));

    const payload = {
        nome: req.body.nome,
        alunosIds: alunosIds
    };

    await fetch(`${API_URL}/turmas/${req.params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.cookies.token}` },
        body: JSON.stringify(payload)
    });
    res.redirect('/professor/turmas');
});

app.delete('/professor/turmas/:id', authenticateServer, async (req, res) => {
    if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
    const response = await fetch(`${API_URL}/turmas/${req.params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${req.cookies.token}` }
    });
    res.sendStatus(response.status);
});
// Práticas
app.get("/student/praticas/json", authenticateServer, async (req, res) => {
  const response = await fetch(`${API_URL}/praticas`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });
  const praticas = await response.json();
  res.json(praticas);
});

app.get("/student/praticas", authenticateServer, async (req, res) => {
  const response = await fetch(`${API_URL}/praticas`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });
  const praticas = await response.json();
  res.render("student/praticas", { user: req.user, praticas });
});

app.get("/professor/praticas", authenticateServer, (req, res) => {
  res.render("professor/praticas", { user: req.user });
});

app.get("/tecnico/praticas", authenticateServer, async (req, res) => {
  if (req.user.profile !== "tecnico") {
    return res.status(403).send("Acesso negado.");
  }

  const response = await fetch(`${API_URL}/praticas`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });

  if (!response.ok) {
    return res.status(500).send("Erro ao carregar práticas da API.");
  }

  const praticas = await response.json();
  res.render("tecnico/praticas", { user: req.user, praticas });
});

app.get("/professor/add-praticas", authenticateServer, async (req, res) => {
  if (req.user.profile !== "professor")
    return res.status(403).send("Acesso negado.");

  const [turmasRes, componentesRes] = await Promise.all([
    fetch(`${API_URL}/turmas/professor/${req.user.id}`, {
      headers: { Authorization: `Bearer ${req.cookies.token}` },
    }),
    fetch(`${API_URL}/componentes`, {
      headers: { Authorization: `Bearer ${req.cookies.token}` },
    }),
  ]);

  const turmas = await turmasRes.json();
  const componentes = await componentesRes.json();

  res.render("professor/add-praticas", { user: req.user, turmas, componentes });
});

app.post("/professor/praticas", authenticateServer, async (req, res) => {
  if (req.user.profile !== "professor")
    return res.status(403).send("Acesso negado.");

  const response = await fetch(`${API_URL}/praticas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.cookies.token}`,
    },
    body: JSON.stringify(req.body),
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    return res
      .status(response.status)
      .send(`Erro ao criar prática: ${errorMsg}`);
  }

  res.redirect("/professor/praticas");
});

app.get("/professor/praticas/json", authenticateServer, async (req, res) => {
  if (req.user.profile !== "professor")
    return res.status(403).send("Acesso negado.");
  const response = await fetch(`${API_URL}/praticas`, {
    headers: { Authorization: `Bearer ${req.cookies.token}` },
  });
  const data = await response.json();
  res.json(data);
});
app.get("/professor/praticas", authenticateServer, (req, res) => {
  res.render("professor/praticas", { user: req.user });
});

app.get('/professor/praticas/:id/edit', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  
  const praticaId = req.params.id;
  const headers = { Authorization: `Bearer ${req.cookies.token}` };

  const [praticaRes, turmasRes, componentesRes] = await Promise.all([
      fetch(`${API_URL}/praticas/${praticaId}`, { headers }),
      fetch(`${API_URL}/turmas/professor/${req.user.id}`, { headers }),
      fetch(`${API_URL}/componentes`, { headers })
  ]);

  if (!praticaRes.ok) return res.status(404).send("Prática não encontrada.");

  const pratica = await praticaRes.json();
  const turmas = await turmasRes.json();
  const componentes = await componentesRes.json();

  res.render('professor/edit-pratica', { user: req.user, pratica, turmas, componentes });
});

app.delete('/professor/praticas/:id', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");
  
  const response = await fetch(`${API_URL}/praticas/${req.params.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${req.cookies.token}` }
  });

  res.sendStatus(response.status);
});

app.put('/professor/praticas/:id', authenticateServer, async (req, res) => {
  if (req.user.profile !== 'professor') return res.status(403).send("Acesso negado.");

  const response = await fetch(`${API_URL}/praticas/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${req.cookies.token}` },
    body: JSON.stringify(req.body)
  });

  if (!response.ok) {
    return res.status(response.status).send(await response.text());
  }
  
  const data = await response.json();
  res.status(200).json(data);
});
app.listen(PORT, () => {
  console.log(`Server.js ouvindo na porta ${PORT}`);
});
