/* ==========================================================
   i18n.js
   Sistema de tradução do PetCare (Português / Inglês).

   COMO USAR EM QUALQUER TELA:
   1. Inclui esse script (depois de petsdb.js, antes do script
      da própria página): <script src="i18n.js"></script>
   2. Em qualquer texto que precise ser traduzido, adiciona o
      atributo data-i18n="chave" no elemento HTML, por exemplo:
        <h2 data-i18n="config_titulo">Configurações</h2>
   3. Cadastra essa "chave" no dicionário TRADUCOES aqui embaixo,
      com o texto em pt e em en.
   4. Chama aplicarTraducoes() no DOMContentLoaded da página.

   Sempre que o idioma mudar (na tela de Configurações), a função
   aplicarTraducoes() já é chamada de novo automaticamente, então
   a troca acontece na hora, sem precisar recarregar a página.
   ========================================================== */

const TRADUCOES = {
    // ---------- Navbar (aparece em toda tela) ----------
    nav_inicio:       { pt: "Início",        en: "Home" },
    nav_saude:        { pt: "Saúde",         en: "Health" },
    nav_vacinas:      { pt: "Vacinas",       en: "Vaccines" },
    nav_consultas:    { pt: "Consultas",     en: "Appointments" },
    nav_lembretes:    { pt: "Lembretes",     en: "Reminders" },

    // ---------- Configurações ----------
    config_titulo:        { pt: "Configurações",                    en: "Settings" },
    config_subtitulo:      { pt: "Personalize suas preferências",    en: "Customize your preferences" },
    config_opcoes:          { pt: "Opções",                          en: "Options" },
    config_nome:            { pt: "Nome",                            en: "Name" },
    config_telefone:        { pt: "Telefone",                        en: "Phone" },
    config_email:           { pt: "E-mail",                          en: "Email" },
    config_nascimento:      { pt: "Data de Nascimento",              en: "Date of Birth" },
    config_senha:           { pt: "Senha",                           en: "Password" },
    config_notificacoes:    { pt: "Notificações",                    en: "Notifications" },
    config_conta:            { pt: "Conta",                           en: "Account" },
    config_idioma:          { pt: "Idioma",                          en: "Language" },
    config_privacidade:     { pt: "Política de Privacidade",         en: "Privacy Policy" },
    config_localizacao:     { pt: "Informação de Localização",       en: "Location Information" },
    config_sair:            { pt: "Sair da Conta",                   en: "Log Out" },
    config_receber_notif:   { pt: "Receber notificações:",           en: "Receive notifications:" },
    config_notif_perdido:   { pt: "Quando se aproximar de um animal perdido", en: "When you're near a lost pet" },
    config_notif_mural:     { pt: "Quando receber mensagens do mural", en: "When you receive board messages" },
    config_notif_lembretes: { pt: "Em datas de lembretes, consultas e vencimento de vacinas", en: "On reminder, appointment, and vaccine due dates" },
    config_permitir_local:  { pt: "Permitir uso da localização para:", en: "Allow location use to:" },

    // ---------- Home ----------
    home_ola:            { pt: "Olá",                    en: "Hello" },
    home_ver_perfil:      { pt: "Ver perfil",             en: "View profile" },
    home_acesso_rapido:    { pt: "Acesso Rápido",          en: "Quick Access" },
    home_lembretes_ativos: { pt: "Lembretes Ativos",     en: "Active Reminders" },
    home_ver_todos:        { pt: "Ver todos",              en: "See all" },
    home_adicionar:        { pt: "Adicionar",              en: "Add" },
    home_nenhum_lembrete:  { pt: "Nenhum lembrete para hoje.", en: "No reminders for today." },
};

// Idioma atual (lido das preferências salvas; padrão pt-BR)
function i18nIdiomaAtual() {
    try {
        const prefs = (typeof petcareObterPreferencias === "function") ? petcareObterPreferencias() : null;
        const codigo = (prefs && prefs.idioma) ? prefs.idioma : "pt-BR";
        return codigo.startsWith("en") ? "en" : "pt";
    } catch (e) {
        return "pt";
    }
}

// Traduz uma chave específica (útil dentro de JS, não só em HTML estático)
function t(chave) {
    const idioma = i18nIdiomaAtual();
    if (!TRADUCOES[chave]) {
        console.warn("Chave de tradução não encontrada:", chave);
        return chave;
    }
    return TRADUCOES[chave][idioma] || TRADUCOES[chave].pt;
}

// Varre a página e troca o texto de todo elemento com data-i18n="chave"
function aplicarTraducoes() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const chave = el.getAttribute('data-i18n');
        el.innerText = t(chave);
    });
}