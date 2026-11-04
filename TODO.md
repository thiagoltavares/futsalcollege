# TODO

Pendências do Revela 10 em produção (`revela10.com.br`). Atualizado em 4 de novembro de 2026.

## Contas e infraestrutura

- [ ] **Mover o projeto do Supabase para uma conta própria do Revela 10 / Futsal College.** Hoje o
  projeto `futsal-college` (ref `uhrndpekdmxobiqhciyp`) está na organização **AraLabs**, numa conta
  diferente da que o Chrome e a CLI usam no dia a dia (organização Arafit). Isso já custou um login
  quebrado: ninguém sabia qual e-mail abria o painel. Criar uma conta/organização do produto,
  transferir o projeto (Settings, General, Transfer project) e trocar o acesso do MCP e da CLI.
  O mesmo vale para a Vercel (hoje `thiagoltavares-projects`) e para o Cloudflare.
- [ ] Desligar o cadastro de novos usuários no Supabase (Authentication, Sign In / Providers,
  "Allow new users to sign up"). O `/entrar` já não cria conta, mas a API ainda aceita.
- [ ] Aplicar a migration 0016 em produção (só profissional credenciado assina laudo). Foi recusada
  no deploy de 03/11 para manter o foco na pesquisa.
- [ ] Ligar o repositório do GitHub à Vercel, para o deploy sair a cada push. Hoje é só pela CLI, e
  a API da Vercel cai a intervalos na rede local.

## Dados de teste em produção

- [ ] Decidir o que fazer com a base de teste em produção: 27 contas `@exemplo.test` (bloqueadas em
  04/11), 72 atletas, 32 laudos, 55 consentimentos e 303 arquivos no storage.
- [ ] Linha de teste na pesquisa: origem `teste-deploy`, organização "Teste de deploy". Ignorar na
  análise ou apagar.

## Antes de divulgar em escala

- [ ] Uma linha de política de privacidade no site e um jeito de descadastrar, antes da primeira
  mensagem para quem deixou contato na pesquisa.
- [ ] E-mail `@revela10.com.br`: o MX e o `mail` apontavam para o servidor antigo, que não responde.
- [ ] Decidir vídeo público ou só para clube verificado, e alinhar o termo de consentimento (hoje
  ele promete vídeo só para olheiro verificado).
