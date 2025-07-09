function loadComponentes() {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("componentes-container");
    const searchInput = document.querySelector("input[name='search']");
    let todosComponentes = [];

    function renderComponentes(filtro = "") {
      container.innerHTML = ""; 

      const componentesFiltrados = todosComponentes.filter(comp =>
        comp.nome.toLowerCase().includes(filtro.toLowerCase())
      );

      if (componentesFiltrados.length === 0) {
        container.innerHTML = "<p>Nenhum componente encontrado.</p>";
        return;
      }

      componentesFiltrados.forEach(comp => {
        const card = document.createElement("div");
        card.classList.add("componentes-card");

        card.innerHTML = `
          <h2>${comp.nome}</h2>
          <p><strong>Tipo:</strong> ${comp.tipo}</p>
          <p><strong>Descrição:</strong> ${comp.descricao}</p>
          ${
            comp.exigeId
              ? `<p><strong>IDs:</strong></p>
                 <ul>${comp.ids.map(id => `<li>${id}</li>`).join("")}</ul>`
              : `<p><strong>Quantidade:</strong> ${comp.quantidade}</p>`
          }
        `;

        container.appendChild(card);
      });
    }

    fetch("/api/componentes")
      .then(res => res.json())
      .then(data => {
        todosComponentes = data;
        renderComponentes();
      })
      .catch(err => {
        console.error("Erro ao buscar componentes:", err);
        container.innerHTML = "<p>Erro ao carregar componentes.</p>";
      });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const filtro = searchInput.value;
        renderComponentes(filtro);
      });
    }
  });
}




function loadPraticas(userId) {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("praticas-container");
    if (!container || !userId) return;

    fetch(`/api/praticas?userId=${userId}`)
      .then(res => res.json())
      .then(praticas => {
        if (!praticas.length) {
          container.innerHTML = "<p>Nenhuma prática encontrada.</p>";
          return;
        }

        praticas.forEach(pratica => {
          const card = document.createElement("div");
          card.classList.add("student-card");

          const componentesHTML = pratica.componentes.map(comp => {
            if (comp.ids) {
              return `<li>${comp.nome} (IDs: ${comp.ids.join(", ")})</li>`;
            } else {
              return `<li>${comp.nome} (Qtd: ${comp.quantidade})</li>`;
            }
          }).join("");

          card.innerHTML = `
            <h2>${pratica.titulo}</h2>
            <p><strong>Descrição:</strong> ${pratica.descricao}</p>
            <p><strong>Turma:</strong> ${pratica.turmaId}</p>
            <p><strong>Componentes:</strong></p>
            <ul>${componentesHTML}</ul>
          `;

          container.appendChild(card);
        });
      })
      .catch(err => {
        console.error("Erro ao buscar práticas:", err);
        container.innerHTML = "<p>Erro ao carregar práticas.</p>";
      });
  });
}


function loadTurmas(userId) {
  fetch(`/api/turmas?userId=${userId}`)
    .then(res => res.json())
    .then(({ minhasTurmas, outrasTurmas }) => {
      const minhasContainer = document.getElementById("minhas-turmas");
      const outrasContainer = document.getElementById("outras-turmas");

      minhasContainer.innerHTML = "";
      outrasContainer.innerHTML = "";

      if (!minhasTurmas.length) {
        minhasContainer.innerHTML = "<p>Você ainda não participa de nenhuma turma.</p>";
      } else {
        minhasTurmas.forEach(turma => {
          const card = document.createElement("div");
          card.classList.add("turma-card");
          card.innerHTML = `
            <h2>${turma.nome}</h2>
            <p><strong>Práticas:</strong> ${turma.praticasIds.length}</p>
          `;
          minhasContainer.appendChild(card);
        });
      }

      if (!outrasTurmas.length) {
        outrasContainer.innerHTML = "<p>Não há outras turmas disponíveis.</p>";
      } else {
        outrasTurmas.forEach(turma => {
          const card = document.createElement("div");
          card.classList.add("turma-card");
          card.innerHTML = `
            <h2>${turma.nome}</h2>
            <form method="POST" action="/student/turmas">
              <input type="hidden" name="turmaId" value="${turma.id}" />
              <button class="btn btn-primary mt-2" type="submit">Participar</button>
            </form>
          `;
          outrasContainer.appendChild(card);
        });
      }
    })
    .catch(err => {
      console.error("Erro ao carregar turmas:", err);
      document.getElementById("minhas-turmas").innerHTML = "<p>Erro ao carregar turmas.</p>";
    });
}
