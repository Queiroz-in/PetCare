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