/* ==========================================================
   petsdb.js
   Camada de dados do PetCare — usada em TODAS as telas.

   NOVIDADE IMPORTANTE: agora os dados são separados POR CONTA.
   Cada usuário logado só vê os próprios pets, vacinas, consultas,
   lembretes e preferências — puxados pelo próprio login, não um
   "balde" compartilhado por todo mundo que usa o app.

   O único dado que continua GLOBAL (compartilhado por todo mundo,
   de propósito) é o Mural de Animais Perdidos — é uma rede social,
   então todo post deve aparecer pra todo usuário.

   Duas responsabilidades, como antes:
   1) PERSISTÊNCIA LOCAL (localStorage): fallback pra quando a
      página abre fora do app (sem window.AppInventor).
   2) PONTE COM O APP INVENTOR / FIREBASE / CLOUDDB: enviarComando
      e receberDadosBanco, no fim do arquivo.
   ========================================================== */


/* ==========================================================
   0. USUÁRIO ATUAL (conta logada)
   ========================================================== */

// Transforma um e-mail num identificador seguro pra usar em tags/chaves
// (só letras minúsculas, números e "_")
function sanitizarEmailParaId(email) {
    return (email || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
}

const PETCARE_USUARIO_ATUAL_KEY = 'petcare_usuario_atual_v1';

function petcareObterUsuarioAtual() {
    return localStorage.getItem(PETCARE_USUARIO_ATUAL_KEY) || null;
}
function petcareDefinirUsuarioAtual(email) {
    localStorage.setItem(PETCARE_USUARIO_ATUAL_KEY, sanitizarEmailParaId(email));
}
function petcareLimparUsuarioAtual() {
    localStorage.removeItem(PETCARE_USUARIO_ATUAL_KEY);
}

// Chave de localStorage isolada por conta (pra não misturar dados de
// contas diferentes testadas no mesmo navegador/aparelho)
function chaveLocal(baseChave) {
    const usuario = petcareObterUsuarioAtual();
    return usuario ? baseChave + "__" + usuario : baseChave;
}

// Tag remota (CloudDB/Firebase) isolada por conta. Formato: "usuario::base"
// O "::" nunca aparece nem no id do usuário nem nos nomes-base, então dá
// pra separar os dois de volta com segurança (usado em receberDadosBanco).
function tagUsuario(baseTag) {
    const usuario = petcareObterUsuarioAtual();
    if (!usuario) {
        console.warn("tagUsuario chamado sem usuário logado — usando tag sem escopo:", baseTag);
        return baseTag;
    }
    return usuario + "::" + baseTag;
}

// Usado só no login/cadastro, quando ainda não sabemos se o e-mail
// digitado é o "usuário atual" (pode estar errado/não existir ainda)
function tagContaPorEmail(email) {
    return sanitizarEmailParaId(email) + "::conta";
}


/* ==========================================================
   1. PETS (por conta)
   ========================================================== */

function petcareObterPets() {
    try {
        const raw = localStorage.getItem(chaveLocal('petcare_pets_v1'));
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler pets salvos localmente:', e);
        return [];
    }
}

function petcareSalvarPets(lista) {
    try {
        localStorage.setItem(chaveLocal('petcare_pets_v1'), JSON.stringify(lista));
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

function petcareFormatoHome(lista) {
    return lista.map(p =>
        [p.id, p.nome, petcareCalcularIdade(p.nascimento), (p.peso ? p.peso + ' kg' : '-'), (p.raca || '-'), ''].join(',')
    ).join('|');
}
function petcareFormatoSaude(lista) {
    return lista.map(p => [p.id, p.nome, (p.tipo || 'Pet')].join(',')).join('|');
}
function petcareFormatoSimples(lista) {
    return lista.map(p => [p.id, p.nome].join(',')).join('|');
}


/* ==========================================================
   2. ARMAZENAMENTO GENÉRICO POR PET (vacinas, histórico)
      { "pet_123": [ {...} ], "pet_456": [ {...} ] } - por conta
   ========================================================== */

function petcareObterTudo(chave) {
    try {
        const raw = localStorage.getItem(chaveLocal(chave));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('Erro ao ler dados locais (' + chave + '):', e);
        return {};
    }
}
function petcareSalvarTudo(chave, objeto) {
    try {
        localStorage.setItem(chaveLocal(chave), JSON.stringify(objeto));
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

const PETCARE_VACINAS_KEY = 'petcare_vacinas_v1';
function petcareObterVacinas(petId) { return petcareObterListaPet(PETCARE_VACINAS_KEY, petId); }
function petcareSalvarVacinas(petId, lista) { return petcareSalvarListaPet(PETCARE_VACINAS_KEY, petId, lista); }
function petcareAdicionarVacina(petId, vacina) { return petcareAdicionarItemPet(PETCARE_VACINAS_KEY, petId, vacina); }

const PETCARE_HISTORICO_KEY = 'petcare_historico_v1';
function petcareObterHistorico(petId) { return petcareObterListaPet(PETCARE_HISTORICO_KEY, petId); }
function petcareSalvarHistorico(petId, lista) { return petcareSalvarListaPet(PETCARE_HISTORICO_KEY, petId, lista); }
function petcareAdicionarHistorico(petId, registro) { return petcareAdicionarItemPet(PETCARE_HISTORICO_KEY, petId, registro); }


/* ==========================================================
   3. LISTAS GLOBAIS DA CONTA (consultas e lembretes cobrem
      todos os pets DA MESMA CONTA numa lista só)
   ========================================================== */

function petcareObterConsultas() {
    try { return JSON.parse(localStorage.getItem(chaveLocal('petcare_consultas_v1')) || "[]"); }
    catch (e) { return []; }
}
function petcareSalvarConsultas(lista) {
    localStorage.setItem(chaveLocal('petcare_consultas_v1'), JSON.stringify(lista));
    return lista;
}

function petcareObterLembretes() {
    try { return JSON.parse(localStorage.getItem(chaveLocal('petcare_lembretes_v1')) || "[]"); }
    catch (e) { return []; }
}
function petcareSalvarLembretes(lista) {
    localStorage.setItem(chaveLocal('petcare_lembretes_v1'), JSON.stringify(lista));
    return lista;
}


/* ==========================================================
   4. MURAL DE ANIMAIS PERDIDOS — GLOBAL DE PROPÓSITO
      (rede social: todo mundo vê os posts de todo mundo)
   ========================================================== */

const PETCARE_PERDIDOS_KEY = 'petcare_perdidos_v1';
function petcareObterPerdidos() {
    try { return JSON.parse(localStorage.getItem(PETCARE_PERDIDOS_KEY) || "[]"); }
    catch (e) { return []; }
}
function petcareSalvarPerdidos(lista) {
    localStorage.setItem(PETCARE_PERDIDOS_KEY, JSON.stringify(lista));
    return lista;
}


/* ==========================================================
   5. CONTA E PREFERÊNCIAS (por conta)
   ========================================================== */

function petcareObterConta() {
    try { return JSON.parse(localStorage.getItem(chaveLocal('petcare_conta_v1')) || "null"); }
    catch (e) { return null; }
}
function petcareSalvarConta(objeto) {
    localStorage.setItem(chaveLocal('petcare_conta_v1'), JSON.stringify(objeto));
    return objeto;
}

function petcareObterPreferencias() {
    try { return JSON.parse(localStorage.getItem(chaveLocal('petcare_preferencias_v1')) || "null"); }
    catch (e) { return null; }
}
function petcareSalvarPreferencias(objeto) {
    localStorage.setItem(chaveLocal('petcare_preferencias_v1'), JSON.stringify(objeto));
    return objeto;
}

// ---------- Sessão ("Lembrar de mim") ----------
const PETCARE_SESSAO_KEY = 'petcare_sessao_v1';
function petcareObterSessao() {
    try { return JSON.parse(localStorage.getItem(PETCARE_SESSAO_KEY) || "null"); }
    catch (e) { return null; }
}
function petcareSalvarSessao(objeto) {
    localStorage.setItem(PETCARE_SESSAO_KEY, JSON.stringify(objeto));
    return objeto;
}
function petcareLimparSessao() {
    localStorage.removeItem(PETCARE_SESSAO_KEY);
}

/* ---------- Diretório local de contas (só pra testar no navegador) ----------
   Fora do app, não temos como perguntar pro CloudDB "esse e-mail já existe?"
   então mantemos uma lista simples aqui, só pra simular o mesmo
   comportamento que o banco de verdade vai ter. */
const PETCARE_DIRETORIO_CONTAS_KEY = 'petcare_diretorio_contas_v1';
function petcareObterDiretorioContas() {
    try { return JSON.parse(localStorage.getItem(PETCARE_DIRETORIO_CONTAS_KEY) || "{}"); }
    catch (e) { return {}; }
}
function petcareRegistrarContaNoDiretorio(email, dadosConta) {
    const dir = petcareObterDiretorioContas();
    dir[sanitizarEmailParaId(email)] = dadosConta;
    localStorage.setItem(PETCARE_DIRETORIO_CONTAS_KEY, JSON.stringify(dir));
}
function petcareBuscarContaNoDiretorio(email) {
    const dir = petcareObterDiretorioContas();
    return dir[sanitizarEmailParaId(email)] || null;
}


/* ==========================================================
   6. PONTE COM O APP INVENTOR / FIREBASE / CLOUDDB
   ==========================================================
   Protocolo (sem mudança nenhuma nos blocos do App Inventor):

       "COMANDO|TAG|DADOS_EM_JSON"

   A única diferença agora é que a TAG passa a vir no formato
   "usuario::base" (ex: "joao_gmail_com::pets") pra maioria dos
   dados — exceto o Mural de Perdidos (tag "perdidos", sem
   escopo) e a checagem de conta durante login/cadastro (tag
   "email_da_pessoa::conta", construída antes de sabermos se
   aquele e-mail é de fato "o usuário atual").

   Os blocos do App Inventor continuam exatamente iguais — pra
   eles, é só um texto de tag qualquer, não importa o formato.
   ========================================================== */

/* ---------- Aviso seguro (substitui alert() em código que roda via RunJavaScript) ----------
   O alert() do navegador pode não funcionar (e travar a função inteira) quando o
   código é executado pelo App Inventor via RunJavaScript, em vez de por um clique
   direto do usuário. Esta função mostra um aviso na tela sem depender de alert(). */
let _contadorAvisos = 0;
function mostrarAviso(mensagem, corFundo) {
    try {
        const topo = 16 + (_contadorAvisos * 60);
        _contadorAvisos++;
        var aviso = document.createElement('div');
        aviso.innerText = mensagem;
        aviso.style.cssText = 'position:fixed;top:' + topo + 'px;left:16px;right:16px;background:' +
            (corFundo || '#1F2937') + ';color:white;padding:14px 16px;border-radius:12px;' +
            'font-family:Inter,sans-serif;font-size:12px;z-index:999999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
        document.body.appendChild(aviso);
        setTimeout(() => { aviso.remove(); _contadorAvisos--; }, 8000);
    } catch (e) {
        console.error("Erro ao mostrar aviso:", e);
    }
}

function enviarComando(comando, tag, dadosObjeto) {
    // O "nonce" no final garante que o texto NUNCA seja idêntico ao comando
    // anterior - o App Inventor só dispara WebViewStringChange quando o valor
    // muda de verdade, então sem isso, comandos repetidos (mesmo comando, mesma
    // tag, mesmos dados) seriam ignorados silenciosamente.
    const nonce = Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const payload = comando + "|" + tag + "|" + JSON.stringify(dadosObjeto) + "|" + nonce;
    if (window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString(payload);
    } else {
        console.log("[Modo Web - sem AppInventor] Comando:", payload);
    }
    return payload;
}

function receberDadosBanco(tag, valorRecebido) {
    if (!tag) { console.warn("receberDadosBanco chamado sem tag."); return; }

    // Separa "usuario::base" de volta em duas partes (quando aplicável)
    let base = tag.trim();
    if (base.indexOf("::") !== -1) {
        base = base.split("::")[1].trim();
    }

    let dados = null;
    if (valorRecebido && valorRecebido !== "VAZIO") {
        try { dados = JSON.parse(valorRecebido); } catch (e) {
            console.error("Erro ao converter dados do banco (tag=" + tag + "):", e);
        }
    }

    if (base === "pets") {
        let lista = dados || [];

        // Trava de segurança: nunca apaga pets já salvos localmente por
        // causa de uma resposta vazia/falha temporária do banco.
        if (lista.length === 0) {
            const jaSalvos = petcareObterPets();
            if (jaSalvos.length > 0) {
                console.warn("Lista de pets veio vazia do banco, mas já existiam pets salvos localmente - mantendo.");
                lista = jaSalvos;
            }
        }

        petcareSalvarPets(lista);
        if (typeof atualizarDadosDosPets === "function") atualizarDadosDosPets(petcareFormatoHome(lista));
        if (typeof carregarPetsDaCarteira === "function") carregarPetsDaCarteira(petcareFormatoSimples(lista));
        if (typeof carregarPetsDoBanco === "function") carregarPetsDoBanco(petcareFormatoSaude(lista));
        if (typeof carregarPetsConsultas === "function") carregarPetsConsultas(petcareFormatoSimples(lista));
        if (typeof carregarPetsLembretes === "function") carregarPetsLembretes(petcareFormatoSimples(lista));
        if (typeof aoReceberListaPets === "function") aoReceberListaPets(lista);

    } else if (base.indexOf("vacinas_") === 0) {
        const petId = base.substring("vacinas_".length);
        const lista = dados || [];
        petcareSalvarVacinas(petId, lista);
        if (typeof carregarListaVacinasJSON === "function") carregarListaVacinasJSON(JSON.stringify(lista));

    } else if (base.indexOf("historico_") === 0) {
        const petId = base.substring("historico_".length);
        const lista = dados || [];
        petcareSalvarHistorico(petId, lista);
        if (typeof carregarHistoricoJSON === "function") carregarHistoricoJSON(JSON.stringify(lista));

    } else if (base === "consultas") {
        const lista = dados || [];
        petcareSalvarConsultas(lista);
        if (typeof carregarConsultas === "function") carregarConsultas(JSON.stringify(lista));

    } else if (base === "lembretes") {
        const lista = dados || [];
        petcareSalvarLembretes(lista);
        if (typeof carregarLembretes === "function") carregarLembretes(JSON.stringify(lista));

    } else if (base === "perdidos") {
        // Este é global, sem escopo de usuário - não passa pelo "::"
        const lista = dados || [];
        petcareSalvarPerdidos(lista);
        if (typeof carregarPerdidosJSON === "function") carregarPerdidosJSON(JSON.stringify(lista));

    } else if (base === "conta") {
        const conta = dados || {};
        petcareSalvarConta(conta);
        if (typeof carregarDadosConta === "function") {
            carregarDadosConta([conta.nome, conta.telefone, conta.email, conta.nascimento].join("|"));
        }
        if (typeof aoReceberContaLogin === "function") {
            aoReceberContaLogin(conta);
        }

    } else if (base === "preferencias") {
        const prefs = dados || {};
        petcareSalvarPreferencias(prefs);
        if (typeof carregarPreferencias === "function") {
            const p = (chave) => (prefs[chave] ? chave + "_ON" : chave + "_OFF");
            carregarPreferencias([p("PERDIDO"), p("MURAL"), p("LEMBRETES"), (prefs.idioma || "pt-BR")].join("|"));
        }

    } else {
        console.warn("Nenhum roteamento definido ainda para a tag:", tag, "(base:", base, ")");
    }
}
