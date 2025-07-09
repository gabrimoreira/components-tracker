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
