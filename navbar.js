function carregarMenuInferior(abaAtiva) {
    // Remove estilos antigos caso a página seja recarregada
    const oldStyle = document.getElementById('navbar-style');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'navbar-style';

    // Cada aba tem sua própria cor de destaque, igual à cor do cabeçalho daquela tela
    const CORES_ABA = {
        home:      { cor: '#FF7A00', bg: '#FFF2E6' },
        saude:     { cor: '#FF5874', bg: '#FFF0F2' },
        vacinas:   { cor: '#00CBB0', bg: '#E2FBF7' },
        consultas: { cor: '#8C5BFF', bg: '#F4EFFF' },
        lembretes: { cor: '#FFB300', bg: '#FFF6E0' },
    };
    const corAtiva = (CORES_ABA[abaAtiva] || CORES_ABA.home).cor;
    const bgAtivo = (CORES_ABA[abaAtiva] || CORES_ABA.home).bg;

    style.innerHTML = `
        #nav-modular {
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 390px;
            height: calc(90px + env(safe-area-inset-bottom, 0px));
            padding-bottom: env(safe-area-inset-bottom, 0px);
            box-sizing: border-box;
            background-color: #FFFFFF;
            border-top-left-radius: 28px;
            border-top-right-radius: 28px;
            box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            z-index: 9999;
            padding-bottom: 5px;
        }
        .nav-item-mod {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: #8E9297;
            font-family: 'Inter', sans-serif;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        /* A caixinha de fundo que aparece quando o botão está ativo */
        .nav-icon-box {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            transition: background-color 0.2s ease;
            position: relative;
        }
        
        /* Padronizando os traços dos ícones */
        .nav-item-mod svg {
            width: 25px;
            height: 25px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2.2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        
        /* Estado Ativo: Aplica a cor e o fundo dinâmico */
        .nav-item-mod.active {
            color: ${corAtiva};
            font-weight: 700;
        }
        .nav-item-mod.active .nav-icon-box {
            background-color: ${bgAtivo};
        }
    `;
    document.head.appendChild(style);

    // Estrutura HTML idêntica ao seu Figma
    const navHTML = `
        <nav id="nav-modular">
            
            <div class="nav-item-mod ${abaAtiva === 'home' ? 'active' : ''}" onclick="navegarAbasGlobal('home')">
                <div class="nav-icon-box">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <path d="M9 22V12h6v10"/>
                    </svg>
                </div>
                <span>${typeof t === "function" ? t('nav_inicio') : 'Início'}</span>
            </div>
            
            <div class="nav-item-mod ${abaAtiva === 'saude' ? 'active' : ''}" onclick="navegarAbasGlobal('saude')">
                <div class="nav-icon-box">
                    <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </div>
                <span>${typeof t === "function" ? t('nav_saude') : 'Saúde'}</span>
            </div>
            
            <div class="nav-item-mod ${abaAtiva === 'vacinas' ? 'active' : ''}" onclick="navegarAbasGlobal('vacinas')">
                <div class="nav-icon-box">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 21l6-6 M14 6l-7 7a2.82 2.82 0 0 0 4 4l7-7Z M12 8l2 2 M9 11l2 2 M16 8l3-3 M17 3l4 4"/>
                    </svg>
                </div>
                <span>${typeof t === "function" ? t('nav_vacinas') : 'Vacinas'}</span>
            </div>
            
            <div class="nav-item-mod ${abaAtiva === 'consultas' ? 'active' : ''}" onclick="navegarAbasGlobal('consultas')">
                <div class="nav-icon-box">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <span>${typeof t === "function" ? t('nav_consultas') : 'Consultas'}</span>
            </div>
            
            <div class="nav-item-mod ${abaAtiva === 'lembretes' ? 'active' : ''}" onclick="navegarAbasGlobal('lembretes')">
                <div class="nav-icon-box">
                    <svg viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        <circle cx="18" cy="6" r="3.5" fill="#FF3B30" stroke="none" />
                    </svg>
                </div>
                <span>${typeof t === "function" ? t('nav_lembretes') : 'Lembretes'}</span>
            </div>
            
        </nav>
    `;

    document.getElementById('menu-inferior-container').innerHTML = navHTML;
}

// Função de Navegação
function navegarAbasGlobal(aba) {
    if (window.AppInventor && window.AppInventor.setWebViewString) {
        window.AppInventor.setWebViewString("NAV|" + aba);
    } else if (typeof petcareNavegarComTransicao === "function") {
        petcareNavegarComTransicao(aba + ".html");
    } else {
        window.location.href = aba + ".html";
    }
}