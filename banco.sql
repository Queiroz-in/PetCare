

-- =========================================================================================================
-- Site OBT -- MECATECH
-- INFORMAÇÕES PARA O BANCO DE DADOS DA MECATECH APP --

CREATE DATABASE IF NOT EXISTS mecatech_app;

USE mecatech_app;

-- ===========================================================================================
-- tabelas 
-- ==============================================================================================

CREATE TABLE animais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raca VARCHAR(100),
    data_nascimento DATE,
    peso DECIMAL(5,2),
    idade INT,
    sexo ENUM('M', 'F'),
    doenca VARCHAR(255),
    pelagem VARCHAR(100),
    tipo_sanguineo VARCHAR(10),
    doenca_cronica BOOLEAN DEFAULT FALSE,
    microchip VARCHAR(50),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saudedoanimal(
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    descricao VARCHAR(255),
    nome_alergia VARCHAR(100),
    sintomas VARCHAR(255),
    data_atendimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);

create table diagnosticos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    recomendacao TEXT NOT NULL,
    e_emergencia BOOLEAN DEFAULT FALSE,
    data_diagnostico TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);

CREATE TABLE vacinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    nome_vacina VARCHAR(100) NOT NULL,
    data_aplicacao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    nome_veterinario VARCHAR(100),
    nome_clinica VARCHAR(100),
    data_aplicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);

create table medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    nome_medicamento VARCHAR(100) NOT NULL,
    dosagem VARCHAR(50),
    frequencia VARCHAR(50),
    data_inicio DATE,
    data_fim DATE,
    nome_veterinario VARCHAR(100),
    nome_clinica VARCHAR(100),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
);

create table consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id SERIAL PRIMARY KEY,
    pet_id INT REFERENCES pets(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL, -- Ex: Consulta de Rotina, Banho e Tosa
    data_consulta TIMESTAMP NOT NULL,
    nome_veterinario VARCHAR(100), 
    nome_clinica VARCHAR(100),
    observacoes TEXT, 
    status VARCHAR(30) DEFAULT 'Agendada' -- Agendada, Concluída, Cancelada
);

create table animaisperdidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    local_perda VARCHAR(255),
    data_perda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id)
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    tipo_postagem VARCHAR(20), -- Ex: Perdido, Encontrado, Para Adoção
    localizacao VARCHAR(255),
    telefone_contato VARCHAR(30),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);

create table clinicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    latitude DECIMAL(10, 8), 
    longitude DECIMAL(11, 8),
    atendimento_24h BOOLEAN DEFAULT FALSE,
    status_atual VARCHAR(20) DEFAULT 'Disponível' -- Disponível, Ocupado
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    clinica_id INT NOT NULL,
    data_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
);

create table lembretes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    data_lembrete TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);



-- ==========================================
-- 4. INFORMAÇÕES SOBRE RAÇAS (Dicionário)
-- ==========================================

CREATE TABLE categorias_especies (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL 
);

CREATE TABLE racas (
    id SERIAL PRIMARY KEY,
    categoria_id INT REFERENCES categorias_especies(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL, -- Pastor Alemão, Persa, Betta
    porte VARCHAR(50), -- Porte: Pequeno, Médio, Grande
    temperamento VARCHAR(255),
    cuidados TEXT
);

CREATE TABLE predisposicoes_doencas_racas (
    id SERIAL PRIMARY KEY,
    raca_id INT REFERENCES racas(id) ON DELETE CASCADE,
    nome_doenca VARCHAR(150) NOT NULL
);
