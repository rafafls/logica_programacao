function mostrarSecao(id) {
  // Esconde todas as seções
  const secoes = document.querySelectorAll(".secao");
  secoes.forEach(sec => {
    sec.classList.remove("ativa");
  });

  // Ativa a solicitada
  const s = document.getElementById(id);
  if (s) {
    s.classList.add("ativa");
  }
}
