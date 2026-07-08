/* ==========================================================
   validacao.js
   Camada central de validação de dados do PetCare.

   Objetivo: impedir que a pessoa (por engano ou de propósito)
   salve dados sem sentido ou ofensivos — principalmente no
   Mural de Animais Perdidos, que é público pra todo mundo ver.

   Todo formulário do app deve rodar os dados por aqui ANTES de
   chamar petcareAdicionar/enviarComando. Se validarX(...) 
   devolver { valido: false }, mostra a mensagem e para o salvamento.
   ========================================================== */

/* ----------------------------------------------------------
   Lista de palavras impróprias (nomes ofensivos, palavrões).
   Checagem simples: se o texto contiver alguma dessas palavras
   (ignorando maiúsculas/minúsculas e acentos), é bloqueado.
   Não é 100% à prova de burlas (dá pra escrever "p3nis" etc.),
   mas cobre o caso comum e evidente.
   ---------------------------------------------------------- */
const PALAVRAS_BLOQUEADAS = [
    "penis", "pinto", "piroca", "buceta", "caralho", "porra", "puta",
    "viado", "corno", "arrombado", "cuzao", "cu", "foda", "fdp",
    "merda", "idiota", "burro", "retardado"
];

function removerAcentos(txt) {
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function contemPalavraImpropria(texto) {
    if (!texto) return false;
    const limpo = removerAcentos(texto.toLowerCase());
    return PALAVRAS_BLOQUEADAS.some(palavra => {
        // \b garante que é a palavra inteira, não um pedaço de outra
        // (assim "cubo" não é bloqueado por causa de "cu")
        const regex = new RegExp("\\b" + palavra + "\\b", "i");
        return regex.test(limpo);
    });
}

/* ---------------------------------------------------------- */

// Nome (de pet, de pessoa, etc.) — não vazio, tamanho razoável, sem palavrão
function validarNome(nome, { min = 2, max = 40 } = {}) {
    if (!nome || !nome.trim()) return { valido: false, mensagem: "Preencha o nome." };
    const limpo = nome.trim();
    if (limpo.length < min) return { valido: false, mensagem: `O nome precisa ter pelo menos ${min} letras.` };
    if (limpo.length > max) return { valido: false, mensagem: `O nome pode ter no máximo ${max} letras.` };
    if (contemPalavraImpropria(limpo)) return { valido: false, mensagem: "Esse nome não é permitido. Use um nome apropriado." };
    if (/^(.)\1{3,}$/.test(limpo.replace(/\s/g, ''))) return { valido: false, mensagem: "Digite um nome válido." }; // ex: "aaaaaa"
    return { valido: true };
}

// Texto livre (descrição, alergias, observações) — checa só palavrão e tamanho
function validarTextoLivre(texto, { max = 300, obrigatorio = false } = {}) {
    if (!texto || !texto.trim()) {
        return obrigatorio ? { valido: false, mensagem: "Preencha esse campo." } : { valido: true };
    }
    if (texto.length > max) return { valido: false, mensagem: `Esse campo pode ter no máximo ${max} caracteres.` };
    if (contemPalavraImpropria(texto)) return { valido: false, mensagem: "Esse texto contém palavras não permitidas." };
    return { valido: true };
}

// Peso do pet, em kg — precisa ser um número positivo dentro de uma faixa plausível
function validarPeso(pesoStr, { min = 0.05, max = 120 } = {}) {
    if (pesoStr === "" || pesoStr === null || pesoStr === undefined) return { valido: true }; // campo opcional
    const peso = parseFloat(String(pesoStr).replace(",", "."));
    if (isNaN(peso)) return { valido: false, mensagem: "Peso inválido." };
    if (peso <= 0) return { valido: false, mensagem: "O peso precisa ser maior que zero." };
    if (peso < min) return { valido: false, mensagem: `Peso muito baixo (mínimo ${min} kg).` };
    if (peso > max) return { valido: false, mensagem: `Peso muito alto — confirme se digitou certo (máximo ${max} kg).` };
    return { valido: true };
}

// Data de nascimento de um pet — não pode ser no futuro, nem implicar uma idade absurda
function validarDataNascimento(dataStr, { idadeMaximaAnos = 35 } = {}) {
    if (!dataStr) return { valido: true }; // campo opcional
    const data = parseDataFlexivel(dataStr);
    if (!data) return { valido: false, mensagem: "Data de nascimento inválida." };

    const hoje = new Date();
    if (data > hoje) return { valido: false, mensagem: "A data de nascimento não pode ser no futuro." };

    const idadeAnos = (hoje - data) / (1000 * 60 * 60 * 24 * 365.25);
    if (idadeAnos > idadeMaximaAnos) return { valido: false, mensagem: `Essa idade não parece real (mais de ${idadeMaximaAnos} anos).` };
    return { valido: true };
}

// Data de um evento futuro (consulta, lembrete) — não pode ser no passado, nem longe demais no futuro
function validarDataFutura(dataStr, { maxAnosNoFuturo = 3 } = {}) {
    if (!dataStr) return { valido: false, mensagem: "Selecione uma data." };
    const data = parseDataFlexivel(dataStr);
    if (!data) return { valido: false, mensagem: "Data inválida." };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (data < hoje) return { valido: false, mensagem: "Essa data já passou — escolha uma data a partir de hoje." };

    const limite = new Date();
    limite.setFullYear(limite.getFullYear() + maxAnosNoFuturo);
    if (data > limite) return { valido: false, mensagem: `Escolha uma data mais próxima (até ${maxAnosNoFuturo} anos no futuro).` };
    return { valido: true };
}

// Data de um evento passado recente (ex: "quando o animal se perdeu") —
// não pode ser no futuro, nem longe demais no passado
function validarDataPassadaRecente(dataStr, { maxAnosNoPassado = 2 } = {}) {
    if (!dataStr) return { valido: false, mensagem: "Selecione uma data." };
    const data = parseDataFlexivel(dataStr);
    if (!data) return { valido: false, mensagem: "Data inválida." };

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (data > hoje) return { valido: false, mensagem: "Essa data ainda não aconteceu." };

    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - maxAnosNoPassado);
    if (data < limite) return { valido: false, mensagem: `Essa data é antiga demais (máximo ${maxAnosNoPassado} anos atrás).` };
    return { valido: true };
}

// Telefone — checa se tem uma quantidade razoável de dígitos (10 ou 11, com DDD)
function validarTelefone(telStr) {
    if (!telStr || !telStr.trim()) return { valido: false, mensagem: "Preencha o telefone." };
    const digitos = telStr.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 11) {
        return { valido: false, mensagem: "Telefone inválido — inclua o DDD (ex: 11987654321)." };
    }
    return { valido: true };
}

/* ----------------------------------------------------------
   Aceita tanto "DD/MM/AAAA" (usado nos campos de texto manuais,
   como o de nascimento no cadastro) quanto "AAAA-MM-DD" (o
   formato padrão de <input type="date">).
   ---------------------------------------------------------- */
function parseDataFlexivel(dataStr) {
    if (!dataStr) return null;
    let d;
    if (dataStr.includes("/")) {
        const [dia, mes, ano] = dataStr.split("/");
        d = new Date(ano, mes - 1, dia);
    } else {
        d = new Date(dataStr + "T00:00:00");
    }
    return isNaN(d.getTime()) ? null : d;
}