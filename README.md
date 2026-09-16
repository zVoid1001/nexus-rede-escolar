# Projeto rede da escola rita aguiar

SISTEMA WEB — INVENTÁRIO E CERTIFICAÇÃO DE REDE

Crie um sistema web completo, moderno, responsivo e funcional para gerenciamento de infraestrutura de redes. O sistema será utilizado em um projeto escolar da área de redes de computadores.

O sistema deve seguir RIGOROSAMENTE o escopo abaixo.

1. OBJETIVO DO SISTEMA

Desenvolver uma aplicação web para:

Gerenciar o inventário dos pontos de rede;

Relacionar ponto de rede → patch panel/porta → porta de switch → categoria do cabo;

Gerar etiquetas de identificação dos pontos;

Registrar testes de certificação de cabos;

Comparar automaticamente os resultados dos testes com os limites cadastrados da norma;

Informar automaticamente se o teste foi aprovado ou reprovado através de PASS/FAIL.

O sistema deve funcionar como uma aplicação real, com banco de dados persistente.

2. TECNOLOGIAS

Utilize uma stack moderna e adequada para aplicação web.

Preferencialmente:

React

TypeScript

Vite

Tailwind CSS

Componentes modernos e responsivos

Banco de dados PostgreSQL/Supabase

Utilize uma arquitetura organizada, com componentes reutilizáveis e código limpo.

3. DASHBOARD

Crie uma página inicial com um dashboard apresentando informações resumidas do inventário.

Exibir cards com:

Total de pontos de rede;

Total de patch panels;

Total de switches;

Total de testes realizados;

Total de testes PASS;

Total de testes FAIL.

Também apresentar:

Status dos testes

Um gráfico ou resumo mostrando:

PASS

FAIL

Pontos de rede recentes

Mostrar uma tabela com:

Identificação;

Patch panel;

Porta;

Switch;

Porta do switch;

Categoria do cabo;

Status do último teste.

4. INVENTÁRIO DE PONTOS DE REDE

Criar uma página chamada:

Inventário

O usuário deve conseguir cadastrar, visualizar, editar e excluir pontos de rede.

Cada ponto deve possuir:

ID interno;

Identificação do ponto;

Localização;

Patch panel;

Porta do patch panel;

Switch;

Porta do switch;

Categoria do cabo;

Observações;

Data de cadastro.

Exemplo de nomenclatura:

P-001
P-002
P-003

A nomenclatura deve poder ser definida pela equipe.

5. PATCH PANELS

Criar cadastro de patch panels.

Campos:

Nome/identificação;

Número;

Quantidade de portas;

Localização;

Observações.

Permitir relacionar as portas do patch panel aos pontos de rede.

6. SWITCHES

Criar cadastro de switches.

Campos:

Identificação;

Modelo;

Número;

Quantidade de portas;

Localização;

Observações.

Permitir relacionar cada ponto de rede a uma porta específica do switch.

7. RELACIONAMENTO DO INVENTÁRIO

O sistema deve representar claramente a ligação:

PONTO DE REDE
↓
PATCH PANEL
↓
PORTA DO PATCH PANEL
↓
PORTA DO SWITCH
↓
CATEGORIA DO CABO

Exemplo:

P-001
→ Patch Panel PP01
→ Porta 01
→ Switch SW01
→ Porta 12
→ Cabo Cat6

Esse relacionamento deve ser armazenado no banco de dados.

8. CATEGORIA DO CABO

Permitir selecionar a categoria do cabo.

Categorias iniciais:

Cat5e

Cat6

Cat6A

A estrutura deve permitir adicionar outras categorias posteriormente.

9. GERADOR DE ETIQUETAS

Criar uma página:

Gerador de Etiquetas

O sistema deve permitir selecionar um ponto de rede já cadastrado e gerar automaticamente uma etiqueta.

A etiqueta deve apresentar informações como:

IDENTIFICAÇÃO DO PONTO

P-001

PATCH PANEL
PP01 / Porta 01

SWITCH
SW01 / Porta 12

CABO
CAT6

A aparência deve ser simples, profissional e adequada para impressão.

Adicionar botão:

Gerar etiqueta

E botão:

Imprimir

Permitir gerar várias etiquetas de uma vez.

10. NOMENCLATURA

A equipe deve poder definir sua própria nomenclatura.

Criar uma configuração simples para definir o padrão das identificações.

Exemplo:

P-001
P-002
P-003

O sistema deve gerar automaticamente o próximo número disponível.

11. TESTES DE CERTIFICAÇÃO

Criar uma página chamada:

Certificação

O usuário deve conseguir registrar um teste realizado em um ponto de rede.

Campos básicos:

Ponto de rede;

Categoria do cabo;

Data do teste;

Comprimento do cabo;

Resultado do Wire Map;

Resistência;

NEXT;

Return Loss;

Perda de inserção;

Observações.

Os campos devem possuir validação.

12. VALIDAÇÃO AUTOMÁTICA PASS/FAIL

Esta é uma das funções PRINCIPAIS do sistema.

Depois que o usuário inserir os valores do teste, o sistema deve comparar automaticamente cada resultado com os limites da norma configurados para aquela categoria de cabo.

Se TODOS os parâmetros estiverem dentro dos limites:

PASS

Se QUALQUER parâmetro estiver fora dos limites:

FAIL

Exemplo visual:

🟢 PASS

ou

🔴 FAIL

Não permitir que o usuário simplesmente escolha manualmente PASS ou FAIL.

O resultado deve ser calculado pelo sistema.

13. LIMITES DA NORMA

Criar uma estrutura no banco de dados para armazenar os limites utilizados na validação.

Cada categoria de cabo pode possuir seus próprios limites.

Estrutura sugerida:

Categoria;

Parâmetro;

Valor mínimo;

Valor máximo;

Unidade;

Norma de referência.

IMPORTANTE:

Não inventar valores normativos.

Deixar os limites configuráveis no sistema para que a equipe possa inserir os valores corretos da norma utilizada no projeto.

Exibir claramente qual norma e limite estão sendo utilizados na validação.

14. RESULTADO DETALHADO DO TESTE

Depois de registrar um teste, mostrar uma tela detalhada.

Exemplo:

Ponto: P-001
Cabo: Cat6
Data: 02/09/2026

Parâmetro | Medido | Limite | Status

Wire Map | OK | OK | PASS
NEXT | valor medido | limite | PASS
Return Loss | valor medido | limite | PASS
Perda de inserção | valor medido | limite | PASS

Resultado final:

🟢 PASS

Caso algum parâmetro falhe:

🔴 FAIL

Destacar qual parâmetro ficou fora do limite.

15. HISTÓRICO DE TESTES

Criar uma página para visualizar todos os testes realizados.

Tabela contendo:

ID;

Ponto;

Categoria;

Data;

Resultado;

Parâmetro que causou falha, quando houver.

Adicionar filtros:

PASS;

FAIL;

Categoria;

Ponto;

Data.

Adicionar campo de pesquisa.

16. BANCO DE DADOS

Criar as tabelas necessárias para armazenar os dados.

Estrutura sugerida:

pontos_rede

id

identificacao

localizacao

patch_panel_id

porta_patch_panel

switch_id

porta_switch

categoria_cabo

observacoes

created_at

patch_panels

id

identificacao

numero_portas

localizacao

observacoes

created_at

switches

id

identificacao

modelo

numero_portas

localizacao

observacoes

created_at

testes_certificacao

id

ponto_rede_id

categoria_cabo

data_teste

comprimento

wire_map

resistencia

next

return_loss

perda_insercao

resultado

observacoes

created_at

limites_norma

id

categoria_cabo

parametro

valor_minimo

valor_maximo

unidade

norma

created_at

A estrutura pode ser ajustada se necessário para melhorar os relacionamentos e integridade dos dados.

17. INTERFACE

Criar uma interface moderna e profissional.

Utilizar:

Menu lateral;

Dashboard;

Cards;

Tabelas;

Formulários;

Modais;

Badges de status;

Botões de ação;

Ícones;

Layout responsivo.

Menu:

🏠 Dashboard
🔌 Inventário
🧩 Patch Panels
🔀 Switches
🏷️ Etiquetas
🧪 Certificação
📋 Histórico
⚙️ Configurações

18. CORES E STATUS

Utilizar uma identidade visual profissional relacionada à área de redes e tecnologia.

PASS deve possuir destaque visual positivo.

FAIL deve possuir destaque visual de erro.

Não exagerar nas cores.

Priorizar legibilidade e aparência profissional.

19. PESQUISA E FILTROS

Adicionar pesquisa e filtros nas principais tabelas.

O usuário deve conseguir pesquisar por:

Identificação do ponto;

Patch panel;

Switch;

Categoria;

Resultado do teste.

20. VALIDAÇÕES

Adicionar validações aos formulários.

Exemplos:

Não permitir identificação duplicada;

Não permitir porta inválida;

Não permitir valores numéricos inválidos;

Campos obrigatórios devem ser informados;

Mostrar mensagens de erro claras;

Confirmar antes de excluir registros.

21. RESPONSIVIDADE

O sistema deve funcionar corretamente em:

Computador;

Notebook;

Tablet;

Celular.

O foco principal é a utilização em computador.

22. FORA DO ESCOPO — NÃO IMPLEMENTAR

NÃO criar:

Sistema de login;

Autenticação de múltiplos usuários;

Sistema de permissões;

Notificações automáticas por e-mail;

Notificações SMS;

Integração com hardware real de teste de cabos;

Controle de certificadores físicos;

Funções que dependam de equipamentos reais.

O sistema deve trabalhar somente com os dados inseridos manualmente pelo usuário.

23. DADOS DE DEMONSTRAÇÃO

Adicionar alguns dados fictícios para demonstrar o funcionamento do sistema.

Criar exemplos como:

P-001 → PP01/01 → SW01/12 → Cat6
P-002 → PP01/02 → SW01/13 → Cat6
P-003 → PP01/03 → SW01/14 → Cat6A

Criar também testes fictícios com resultados PASS e FAIL para demonstrar a validação automática.

Deixar claro que os dados são apenas exemplos.

24. EXPERIÊNCIA DO USUÁRIO

O fluxo principal deve ser simples:

Cadastrar Patch Panel;

Cadastrar Switch;

Cadastrar Ponto de Rede;

Relacionar o ponto ao Patch Panel e Switch;

Selecionar categoria do cabo;

Gerar etiqueta;

Registrar teste de certificação;

Sistema compara os valores automaticamente;

Sistema apresenta PASS ou FAIL;

Resultado fica salvo no histórico.

25. REQUISITO PRINCIPAL

O sistema só será considerado completo quando for possível demonstrar claramente estas três funções:

1 — INVENTÁRIO

Ponto de rede → Patch Panel/Porta → Switch/Porta → Categoria do cabo.

2 — ETIQUETAS

Gerar etiquetas automaticamente utilizando a nomenclatura definida pela equipe.

3 — CERTIFICAÇÃO

Registrar os testes e realizar automaticamente a validação dos resultados contra os limites cadastrados da norma, exibindo PASS ou FAIL.

Priorize essas três funcionalidades acima de qualquer funcionalidade adicional.

Crie o projeto completo, funcional e organizado, com banco de dados persistente, interface responsiva e dados de demonstração.

Antes de finalizar, verifique se todas as funcionalidades obrigatórias do escopo estão funcionando corretamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1644fca2-4961-4c8d-bb33-3646a5219ce6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
