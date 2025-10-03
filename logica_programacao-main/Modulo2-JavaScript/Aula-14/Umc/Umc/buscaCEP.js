//https://viacep.com.br/ws/COLOCAR CEP/json

const cep = document.getElementById("cep");

cep.addEventListener("change", (evento) => {
    let cepUsuario = evento.target.value;
    console.log(cepUsuario);
    buscarCEP(cepUsuario);

});

async function buscarCEP(cepUsuario) {
    let erroCep = document.getElementById("erro");

    try {

        let consultaCEP = await fetch(`https://viacep.com.br/ws/${cepUsuario}/json`);
        let consultaCEPjson = await consultaCEP.json();


        if (consultaCEPjson.erro || !consultaCEPjson.logradouro) {
            throw new Error("CEP INEXISTENTE OU INVÁLIDO");
        }

        erroCep.innerHTML = "";
        preencheCampos(consultaCEPjson);

    } catch (error) {
        erroCep.innerHTML = "CEP INVÁLIDO, TENTE NOVAMENTE !!";
        apagaCampos();
        console.error(error);

    }

}

function preencheCampos(cepJson) {

    let rua = document.getElementById("rua");
    let bairro = document.getElementById("bairro");
    let cidade = document.getElementById("cidade");
    let estado = document.getElementById("estado");
    rua.value = cepJson.logradouro;
    bairro.value = cepJson.bairro;
    cidade.value = cepJson.localidade;
    estado.value = cepJson.uf;

}

function apagaCampos() {
    rua.value = ""
    bairro.value = ""
    cidade.value = ""
    estado.value = ""

}
 
