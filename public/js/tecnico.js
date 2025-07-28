
function loadComponentes() {
  const container = document.getElementById("componentes-container");
  const searchInput = document.querySelector("input[name='search']");
  let todosComponentes = [];

  function renderComponentes(filtro = "") {
    if (!container) return;
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

      const idsHtml = comp.exigeId && Array.isArray(comp.ids)
        ? `<p><strong>IDs:</strong></p>
           <ul>${comp.ids.map(id => `<li>${id}</li>`).join("")}</ul>`
        : `<p><strong>Quantidade:</strong> ${comp.quantidade || 0}</p>`;

      card.innerHTML = `
        <h2>${comp.nome}</h2>
        <p><strong>Tipo:</strong> ${comp.tipo}</p>
        <p><strong>Descrição:</strong> ${comp.descricao}</p>
        ${idsHtml}
      `;
      container.appendChild(card);
    });
  }

  fetch("/tecnico/componentes/json")
    .then(res => res.json())
    .then(data => {
      todosComponentes = data;
      renderComponentes();
    })
    .catch(err => {
      console.error("Erro ao buscar componentes:", err);
      if (container) {
        container.innerHTML = "<p>Erro ao carregar componentes.</p>";
      }
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderComponentes(searchInput.value);
    });
  }
}


function initializeAddComponentesForm() {

  const checkbox = document.getElementById("exigeId");

  const quantidadeInput = document.getElementById("quantidade");
  const quantidadeWrapper = document.getElementById("quantidade-wrapper");
  const idsInput = document.getElementById("ids"); 
  const idsWrapper = document.getElementById("ids-wrapper");

  if (!checkbox) return;

  function toggleFields() {
    if (checkbox.checked) {
      quantidadeInput.disabled = true;
      quantidadeInput.required = false;
      quantidadeInput.value = '';
      quantidadeWrapper.style.display = 'none';

      idsInput.disabled = false;
      idsInput.required = true;
      idsWrapper.style.display = 'block';
    } 
    else {
      quantidadeInput.disabled = false;
      quantidadeInput.required = true;
      quantidadeWrapper.style.display = 'block';

      idsInput.disabled = true;
      idsInput.required = false;
      idsInput.value = '';
      idsWrapper.style.display = 'none';
    }
  }

  checkbox.addEventListener("change", toggleFields);

  toggleFields();
}