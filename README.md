# SME-PRINTER: Sistema de Monitoramento e Análise de Uso de Impressoras 🖨️

Repositório destinado ao controle de versão dos scripts e códigos do **Projeto Integrador III da Univesp (1º Semestre de 2026) - Grupo 09**.

## 📌 Sobre o Projeto

[cite_start]A gestão eficiente de recursos é um desafio constante na administração pública[cite: 14]. [cite_start]Este projeto tem como objetivo desenvolver um sistema automatizado de monitoramento e análise de uso do parque de impressão da Secretaria de Educação da Prefeitura Municipal de Jacareí[cite: 15, 32]. 

[cite_start]Atualmente, os dados gerados pelas impressoras (como níveis de toner e contadores de páginas) não são monitorados ativamente pela Unidade de Tecnologias Educacionais, sendo apenas enviados à empresa locadora, o que gera ineficiências[cite: 40, 41, 62]. [cite_start]O SME-PRINTER visa automatizar a coleta e análise desses dados para embasar a tomada de decisão, otimizar a gestão de suprimentos e promover a redução de custos operacionais[cite: 15, 39].

## 🏗️ Arquitetura da Solução

[cite_start]O sistema foi estruturado em uma arquitetura de três camadas (Backend, Banco de Dados e Frontend)[cite: 63]:

1. [cite_start]**Coleta de Dados (Backend):** Scripts automatizados rodam diariamente em um servidor local para extrair contadores de páginas e níveis de toner de um servidor de monitoramento existente[cite: 18, 64, 67].
2. [cite_start]**Armazenamento (Banco de Dados em Nuvem):** Os dados coletados são validados (exigindo contadores maiores que zero) e enviados para um banco de dados relacional hospedado na nuvem, garantindo segurança através de políticas de nível de linha (RLS)[cite: 18, 36, 65, 69].
3. [cite_start]**Visualização (Frontend):** Prototipagem de um dashboard web interativo para fornecer uma interface limpa e intuitiva aos gestores, facilitando a análise de volumetria e consumo[cite: 37, 66].

## 🚀 Tecnologias Utilizadas

[cite_start]A infraestrutura tecnológica do projeto baseia-se nas seguintes ferramentas e serviços[cite: 72]:

* [cite_start]**Linguagem:** Python 3.12 (scripts de automação e integração via API)[cite: 18, 64, 73].
* [cite_start]**Monitoramento e Protocolos:** Zabbix 6.0 e SNMP (Simple Network Management Protocol)[cite: 17, 46, 72]. [cite_start]O utilitário `snmpwalk` foi utilizado para mapear os OIDs de capacidade máxima e nível restante de toner[cite: 50, 51].
* [cite_start]**Banco de Dados:** PostgreSQL hospedado na plataforma Supabase[cite: 18, 58, 65].
* [cite_start]**Sistema Operacional:** Linux Mint 22.2, utilizando o agendador de tarefas `crontab` para execuções diárias[cite: 17, 67, 70].
* [cite_start]**Frontend:** Next.js (React)[cite: 66].

## 👥 Equipe
[cite_start]**Grupo 09 - Ciências de Dados (Univesp - Polo Jambeiro, 2026)** [cite: 7, 8]
* [cite_start]Elton Felipe Mariano da Fonseca [cite: 2, 9]
* [cite_start]**Tutor:** Marcio de Oliveira Santiago Filho [cite: 12]