let caixa = document.getElementById("mouse")

let nome = document.querySelector("#nome").value

function entradaMouse() {
    caixa.style.backgroundColor = "blue"
}

function saidaMouse(){
    caixa.style.backgroundColor = "gray"
}

function mudaHtml(){
    let nome = document.querySelector("#nome").value
    caixa.innerHTML = nome
}