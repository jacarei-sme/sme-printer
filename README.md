# SME-PRINTER: Sistema de Monitoramento e Análise de Uso de Impressoras

Repositório destinado ao controle de versão dos scripts e códigos do **Projeto Integrador III da Univesp (1º Semestre de 2026) - Grupo 09**.

## 📌 Sobre o Projeto

A gestão eficiente de recursos é um desafio constante na administração pública.
Este projeto tem como objetivo desenvolver um sistema automatizado de monitoramento e análise de uso do parque de impressão da Secretaria de Educação da Prefeitura Municipal de Jacareí. 
Atualmente, os dados gerados pelas impressoras (como níveis de toner e contadores de páginas) não são monitorados ativamente pela Unidade de Tecnologias Educacionais, sendo apenas enviados à empresa locadora, o que gera ineficiências.
O SME-PRINTER visa automatizar a coleta e análise desses dados para embasar a tomada de decisão, otimizar a gestão de suprimentos e promover a redução de custos operacionais.

## Arquitetura da Solução

O sistema foi estruturado em uma arquitetura de três camadas (Backend, Banco de Dados e Frontend):

1. **Coleta de Dados (Backend):** Scripts automatizados rodam diariamente em um servidor local para extrair contadores de páginas e níveis de toner de um servidor de monitoramento existente.
2. **Armazenamento (Banco de Dados em Nuvem):** Os dados coletados são validados (exigindo contadores maiores que zero) e enviados para um banco de dados relacional hospedado na nuvem, garantindo segurança através de políticas de nível de linha (RLS).
3. **Visualização (Frontend):** Prototipagem de um dashboard web interativo para fornecer uma interface limpa e intuitiva aos gestores, facilitando a análise de volumetria e consumo.

## Tecnologias Utilizadas

A infraestrutura tecnológica do projeto baseia-se nas seguintes ferramentas e serviços:

* **Linguagem:** Python 3.12 (scripts de automação e integração via API).
* **Monitoramento e Protocolos:** Zabbix 6.0 e SNMP (Simple Network Management Protocol). O utilitário `snmpwalk` foi utilizado para mapear os OIDs de capacidade máxima e nível restante de toner.
* **Banco de Dados:** PostgreSQL hospedado na plataforma Supabase.
* **Sistema Operacional:** Linux Mint 22.2, utilizando o agendador de tarefas `crontab` para execuções diárias.
* **Frontend:** Next.js (React).

## 👥 Equipe
**Grupo 09 - Ciências de Dados (Univesp - Polo Jambeiro, 2026)**
* Elton Felipe Mariano da Fonseca
* **Tutor:** Marcio de Oliveira Santiago Filho