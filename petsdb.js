/* ==========================================================
   petsdb.js
   Camada de persistência LOCAL dos pets do usuário.

   Isso NÃO substitui o TinyDB do App Inventor — é usado só
   como fallback de teste, pra quando a página é aberta direto
   no navegador (window.AppInventor não existe). Dentro do app
   de verdade, cada tela continua funcionando exatamente como
   antes: esperando o App Inventor chamar a função carregarX(...)
   com os dados vindos do TinyDB.
   ========================================================== */

const PETCARE_STORAGE_KEY = 'petcare_pets_v1';

// Lê a lista de pets salva localmente (array de objetos)
function petcareObterPets() {
    try {
        const raw = localStorage.getItem(PETCARE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler pets salvos localmente:', e);
        return [];
    }
}

// Sobrescreve a lista inteira
function petcareSalvarPets(lista) {
    try {
        localStorage.setItem(PETCARE_STORAGE_KEY, JSON.stringify(lista));
        return true;
    } catch (e) {
        console.error('Erro ao salvar pets localmente:', e);
        return false;
    }
}

// Adiciona um novo pet e devolve o objeto já com o id gerado
function petcareAdicionarPet(pet) {
    const lista = petcareObterPets();
    const novoPet = Object.assign({ id: 'pet_' + Date.now() }, pet);
    lista.push(novoPet);
    petcareSalvarPets(lista);
    return novoPet;
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

/* ----------------------------------------------------------
   Conversores: pegam a lista de pets salva localmente e
   montam a MESMA string "pipe-delimitada" que o App Inventor
   já manda pra cada tela — assim cada página usa sua própria
   função carregarX(dadosString) sem precisar de nenhuma
   lógica nova de renderização.
   ---------------------------------------------------------- */

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

// Busca um pet específico pelo id (usado na tela de Perfil)
function petcareObterPetPorId(petId) {
    const lista = petcareObterPets();
    return lista.find(p => String(p.id) === String(petId)) || null;
}

/* ==========================================================
   ARMAZENAMENTO GENÉRICO POR PET
   Guarda listas (vacinas, histórico, consultas...) num único
   objeto no localStorage, indexado pelo id do pet:
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

function petcareAdicionarItemPet(chave, petId, item) {
    const tudo = petcareObterTudo(chave);
    if (!tudo[petId]) tudo[petId] = [];
    const novoItem = Object.assign({ id: chave + '_' + Date.now() }, item);
    tudo[petId].push(novoItem);
    petcareSalvarTudo(chave, tudo);
    return novoItem;
}

// ---------- Vacinas ----------
const PETCARE_VACINAS_KEY = 'petcare_vacinas_v1';
function petcareObterVacinas(petId) { return petcareObterListaPet(PETCARE_VACINAS_KEY, petId); }
function petcareAdicionarVacina(petId, vacina) { return petcareAdicionarItemPet(PETCARE_VACINAS_KEY, petId, vacina); }

// ---------- Histórico de saúde (sintomas / tratamentos) ----------
const PETCARE_HISTORICO_KEY = 'petcare_historico_v1';
function petcareObterHistorico(petId) { return petcareObterListaPet(PETCARE_HISTORICO_KEY, petId); }
function petcareAdicionarHistorico(petId, registro) { return petcareAdicionarItemPet(PETCARE_HISTORICO_KEY, petId, registro); }

// ---------- Consultas (pronto para quando a tela consultas.html for integrada) ----------
const PETCARE_CONSULTAS_KEY = 'petcare_consultas_v1';
function petcareObterConsultas(petId) { return petcareObterListaPet(PETCARE_CONSULTAS_KEY, petId); }
function petcareAdicionarConsulta(petId, consulta) { return petcareAdicionarItemPet(PETCARE_CONSULTAS_KEY, petId, consulta); }