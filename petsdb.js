/* ==========================================================
   petsdb.js
   Camada de dados do PetCare — usada em TODAS as telas.

   Tem duas responsabilidades:

   1) PERSISTÊNCIA LOCAL (localStorage): usada como fallback
      só quando a página é aberta fora do app (testando no
      navegador, sem window.AppInventor). Deixa o app 100%
      testável mesmo sem o TinyDB/Firebase de verdade.

   2) PONTE COM O APP INVENTOR / FIREBASE: as funções
      enviarComando(...) e receberDadosBanco(...) no fim do
      arquivo. Dentro do app de verdade, é isso que salva e
      busca os dados reais do usuário.

   Nenhuma tela precisa saber QUAL das duas está em uso — cada
   página só chama "salvarX" / "buscarX" e este arquivo decide
   se manda pro AppInventor ou grava no localStorage.
   ========================================================== */


/* ==========================================================
   1. PETS
   ========================================================== */
const PETCARE_STORAGE_KEY = 'petcare_pets_v1';

function petcareObterPets() {
    try {
        const raw = localStorage.getItem(PETCARE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler pets salvos localmente:', e);
        return [];
    }
}

function petcareSalvarPets(lista) {
    try {
        localStorage.setItem(PETCARE_STORAGE_KEY, JSON.stringify(lista));
        return true;
    } catch (e) {
        console.error('Erro ao salvar pets localmente:', e);
        return false;
    }
}

function petcareAdicionarPet(pet) {
    const lista = petcareObterPets();
    const novoPet = Object.assign({ id: 'pet_' + Date.now() }, pet);
    lista.push(novoPet);
    petcareSalvarPets(lista);
    return novoPet;
}

function petcareExcluirPet(petId) {
    const lista = petcareObterPets().filter(p => String(p.id) !== String(petId));
    petcareSalvarPets(lista);
    return lista;
}

function petcareObterPetPorId(petId) {
    return petcareObterPets().find(p => String(p.id) === String(petId)) || null;
}

// Calcula idade aproximada a partir de uma data "DD/MM/AAAA"
function petcareCalcularIdade(dataNascStr) {
    if (!dataNascStr) return "-";
    const partes = dataNascStr.split("/");
    if (partes.length !== 3) return "-";

    const nascimento = new Date(partes[2], partes[1] - 1, partes[0]);
    if (isNaN(nascimento.getTime())) return "-";

    const hoje = new Date();
    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();
    if (hoje.getDate() < nascimento.getDate()) meses--;
    if (meses < 0) { anos--; meses += 12; }

    if (anos < 1) {
        const m = Math.max(meses, 0);
        return m === 1 ? "1 mês" : `${m} meses`;
    }
    return anos === 1 ? "1 ano" : `${anos} anos`;
}

/* Conversores: pegam uma lista de pets (array de objetos) e montam
   a mesma string "pipe-delimitada" que cada tela já sabe ler, pra
   nenhuma tela precisar mudar a própria lógica de renderização. */

// Home: id,nome,idade,peso,raca,alerta
function petcareFormatoHome(lista) {
    return lista.map(p =>
        [p.id, p.nome, petcareCalcularIdade(p.nascimento), (p.peso ? p.peso + ' kg' : '-'), (p.raca || '-'), ''].join(',')
    ).join('|');
}

// Saúde: id,nome,especie
function petcareFormatoSaude(lista) {
    return lista.map(p => [p.id, p.nome, (p.tipo || 'Pet')].join(',')).join('|');
}

// Consultas / Vacinas / Lembretes: id,nome
function petcareFormatoSimples(lista) {
    return lista.map(p => [p.id, p.nome].join(',')).join('|');
}


/* ==========================================================
   2. ARMAZENAMENTO GENÉRICO POR PET (vacinas, histórico...)
      { "pet_123": [ {...}, {...} ], "pet_456": [ {...} ] }
   ========================================================== */

function petcareObterTudo(chave) {
    try {
        const raw = localStorage.getItem(chave);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('Erro ao ler dados locais (' + chave + '):', e);
        return {};
    }
}

function petcareSalvarTudo(chave, objeto) {
    try {
        localStorage.setItem(chave, JSON.stringify(objeto));
        return true;
    } catch (e) {
        console.error('Erro ao salvar dados locais (' + chave + '):', e);
        return false;
    }
}

function petcareObterListaPet(chave, petId) {
    const tudo = petcareObterTudo(chave);
    return tudo[petId] || [];
}

function petcareSalvarListaPet(chave, petId, lista) {
    const tudo = petcareObterTudo(chave);
    tudo[petId] = lista;
    petcareSalvarTudo(chave, tudo);
    return lista;
}

function petcareAdicionarItemPet(chave, petId, item) {
    const lista = petcareObterListaPet(chave, petId);
    const novoItem = Object.assign({ id: chave + '_' + Date.now() }, item);
    lista.push(novoItem);
    petcareSalvarListaPet(chave, petId, lista);
    return novoItem;
}

// ---------- Vacinas (por pet) ----------
const PETCARE_VACINAS_KEY = 'petcare_vacinas_v1';
function petcareObterVacinas(petId) { return petcareObterListaPet(PETCARE_VACINAS_KEY, petId); }
function petcareSalvarVacinas(petId, lista) { return petcareSalvarListaPet(PETCARE_VACINAS_KEY, petId, lista); }
function petcareAdicionarVacina(petId, vacina) { return petcareAdicionarItemPet(PETCARE_VACINAS_KEY, petId, vacina); }

// ---------- Histórico de saúde (por pet) ----------
const PETCARE_HISTORICO_KEY = 'petcare_historico_v1';
function petcareObterHistorico(petId) { return petcareObterListaPet(PETCARE_HISTORICO_KEY, petId); }
function petcareSalvarHistorico(petId, lista) { return petcareSalvarListaPet(PETCARE_HISTORICO_KEY, petId, lista); }
function petcareAdicionarHistorico(petId, registro) { return petcareAdicionarItemPet(PETCARE_HISTORICO_KEY, petId, registro); }


/* ==========================================================
   3. LISTAS GLOBAIS DO USUÁRIO (consultas e lembretes cobrem
      todos os pets numa lista só, cada item com "idPet")
   ========================================================== */

const PETCARE_CONSULTAS_KEY = 'petcare_consultas_v1';
function petcareObterConsultas() {
    try { return JSON.parse(localStorage.getItem(PETCARE_CONSULTAS_KEY) || "[]"); }
    catch (e) { return []; }
}
function petcareSalvarConsultas(lista) {
    localStorage.setItem(PETCARE_CONSULTAS_KEY, JSON.stringify(lista));
    return lista;
}

const PETCARE_LEMBRETES_KEY = 'petcare_lembretes_v1';
function petcareObterLembretes() {
    try { return JSON.parse(localStorage.getItem(PETCARE_LEMBRETES_KEY) || "[]"); }
    catch (e) { return []; }
}
function petcareSalvarLembretes(lista) {
    localStorage.setItem(PETCARE_LEMBRETES_KEY, JSON.stringify(lista));
    return lista;
}


/* ==========================================================
   4. CONTA DO USUÁRIO (um objeto só, global)
   ========================================================== */

const PETCARE_CONTA_KEY = 'petcare_conta_v1';
function petcareObterConta() {
    try { return JSON.parse(localStorage.getItem(PETCARE_CONTA_KEY) || "null"); }
    catch (e) { return null; }
}
function petcareSalvarConta(objeto) {
    localStorage.setItem(PETCARE_CONTA_KEY, JSON.stringify(objeto));
    return objeto;
}

const PETCARE_PREFERENCIAS_KEY = 'petcare_preferencias_v1';
function petcareObterPreferencias() {
    try { return JSON.parse(localStorage.getItem(PETCARE_PREFERENCIAS_KEY) || "null"); }
    catch (e) { return null; }
}
function petcareSalvarPreferencias(objeto) {
    localStorage.setItem(PETCARE_PREFERENCIAS_KEY, JSON.stringify(objeto));
    return objeto;
}


/* ==========================================================
   5. PONTE COM O APP INVENTOR / FIREBASE
   ==========================================================
   Protocolo único usado nas duas direções:

       "COMANDO|TAG|DADOS_EM_JSON"

   - COMANDO contém "BUSCAR" (ler) ou "SALVAR"/"NOVO" (gravar)
   - TAG     é a chave usada no Firebase (StoreValue / GetValue)
   - DADOS   é o payload inteiro em JSON

   Do lado do App Inventor (blocos), a regra é SEMPRE a mesma,
   pra qualquer tela, sem precisar de um "if" por tipo de dado:

     when WebViewer1.WebViewStringChange
     do  initialize local lista_dados to split(WebViewString, "|")
         initialize local comando to lista_dados[1]
         initialize local tag     to lista_dados[2]
         initialize local dados   to lista_dados[3]
         if text comando contains "SALVAR" or comando contains "NOVO"
           then FirebaseDB1.StoreValue(tag, dados)
         else if text comando contains "BUSCAR"
           then FirebaseDB1.GetValue(tag, valueIfTagNotThere = "VAZIO")

     when FirebaseDB1.GotValue (tag, value)
     do  WebViewer1.RunJavaScript(
             join("receberDadosBanco('", tag, "', '", value, "');")
         )

   (LOGIN/CADASTRO em index.html usam o mesmo BUSCAR/SALVAR,
   só que com tag = "conta" — ver tutorial completo à parte.)
   ========================================================== */

// ---------- ENVIO: JS -> App Inventor / Firebase ----------
function enviarComando(comando, tag, dadosObjeto) {
    const payload = comando + "|" + tag + "|" + JSON.stringify(dadosObjeto);
    if (window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString(payload);
    } else {
        console.log("[Modo Web - sem AppInventor] Comando:", payload);
    }
    return payload;
}

/* ---------- RECEPÇÃO: App Inventor -> JS : FUNÇÃO MESTRA ----------
   É esta a função que o RunJavaScript do App Inventor chama sempre,
   pra qualquer tela. Ela olha a "tag" e decide pra qual função de
   cada página os dados devem ir — e também espelha no localStorage,
   pra manter tudo consistente caso o app alterne entre online/offline. */
function receberDadosBanco(tag, valorRecebido) {
    if (!tag) { console.warn("receberDadosBanco chamado sem tag."); return; }

    let dados = null;
    if (valorRecebido && valorRecebido !== "VAZIO") {
        try { dados = JSON.parse(valorRecebido); } catch (e) {
            console.error("Erro ao converter dados do Firebase (tag=" + tag + "):", e);
        }
    }

    if (tag === "pets") {
        const lista = dados || [];
        petcareSalvarPets(lista);
        if (typeof atualizarDadosDosPets === "function") {
            atualizarDadosDosPets(petcareFormatoHome(lista));
        }
        if (typeof carregarPetsDaCarteira === "function") {
            carregarPetsDaCarteira(petcareFormatoSimples(lista));
        }
        if (typeof carregarPetsDoBanco === "function") {
            carregarPetsDoBanco(petcareFormatoSaude(lista));
        }
        if (typeof carregarPetsConsultas === "function") {
            carregarPetsConsultas(petcareFormatoSimples(lista));
        }
        if (typeof carregarPetsLembretes === "function") {
            carregarPetsLembretes(petcareFormatoSimples(lista));
        }
        if (typeof aoReceberListaPets === "function") {
            aoReceberListaPets(lista);
        }

    } else if (tag.indexOf("vacinas_") === 0) {
        const petId = tag.substring("vacinas_".length);
        const lista = dados || [];
        petcareSalvarVacinas(petId, lista);
        if (typeof carregarListaVacinasJSON === "function") {
            carregarListaVacinasJSON(JSON.stringify(lista));
        }

    } else if (tag.indexOf("historico_") === 0) {
        const petId = tag.substring("historico_".length);
        const lista = dados || [];
        petcareSalvarHistorico(petId, lista);
        if (typeof carregarHistoricoJSON === "function") {
            carregarHistoricoJSON(JSON.stringify(lista));
        }

    } else if (tag === "consultas") {
        const lista = dados || [];
        petcareSalvarConsultas(lista);
        if (typeof carregarConsultas === "function") {
            carregarConsultas(JSON.stringify(lista));
        }

    } else if (tag === "lembretes") {
        const lista = dados || [];
        petcareSalvarLembretes(lista);
        if (typeof carregarLembretes === "function") {
            carregarLembretes(JSON.stringify(lista));
        }

    } else if (tag === "conta") {
        const conta = dados || {};
        petcareSalvarConta(conta);
        if (typeof carregarDadosConta === "function") {
            carregarDadosConta([conta.nome, conta.telefone, conta.email, conta.nascimento].join("|"));
        }
        if (typeof aoReceberContaLogin === "function") {
            aoReceberContaLogin(conta);
        }

    } else if (tag === "preferencias") {
        const prefs = dados || {};
        petcareSalvarPreferencias(prefs);
        if (typeof carregarPreferencias === "function") {
            const p = (chave) => (prefs[chave] ? chave + "_ON" : chave + "_OFF");
            carregarPreferencias([p("PERDIDO"), p("MURAL"), p("LEMBRETES"), (prefs.idioma || "pt-BR")].join("|"));
        }

    } else {
        console.warn("Nenhum roteamento definido ainda para a tag:", tag);
    }
}