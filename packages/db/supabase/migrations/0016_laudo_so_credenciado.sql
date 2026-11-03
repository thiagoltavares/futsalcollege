-- Só profissional credenciado assina laudo.
--
-- Até aqui `laudos_do_avaliador` (migration 0008) era uma política `for all`
-- com `avaliador_id = auth.uid()`: QUALQUER conta autenticada — inclusive a
-- de um responsável avaliando o próprio filho — podia inserir um laudo. E a
-- tela de avaliação ainda deixava escolher, num campo de seleção, qual
-- profissional ativo apareceria assinando. Somadas, as duas coisas
-- permitiam publicar uma avaliação com o nome de qualquer avaliador da
-- plataforma. Era o risco mais grave em aberto: o selo é o produto, e o
-- selo estava emprestado a quem pedisse.
--
-- A regra passa a ser: quem insere um laudo precisa ser um profissional
-- ativo e credenciado vinculado à PRÓPRIA conta (`profissionais.user_id`),
-- e o `profissional_id` gravado tem que ser esse mesmo profissional.
-- Ninguém assina no lugar de ninguém. A tela deixou de oferecer a escolha
-- (ver `avaliar/[atletaId]`), mas a regra mora aqui — mesmo raciocínio de
-- `atleta_identificacao`/`atleta_saude` (migration 0001): o banco impõe, a
-- tela só explica.
--
-- `credencial` não nula é o que a conversa de 27/09 chamou de
-- credenciamento, e que o Flávio depois reduziu a "registro ativo no CREF".
-- É o máximo que o banco consegue exigir hoje: o campo é texto livre, então
-- ele prova que alguém preencheu um registro, não que o registro existe e
-- está em dia. A verificação de verdade é processo humano, fora do banco —
-- quando existir tabela de credenciamento com validade e auditoria, esta
-- política passa a apontar para ela.

drop policy laudos_do_avaliador on laudos;

-- Leitura do próprio laudo continua: é como o avaliador alcança um laudo
-- ainda não publicado (`publicado_em` nulo), que a política pública de
-- leitura não devolve.
create policy laudos_leitura_do_avaliador on laudos
  for select
  using (avaliador_id = auth.uid());

create policy laudos_insercao_do_profissional on laudos
  for insert
  with check (
    avaliador_id = auth.uid()
    and exists (
      select 1
      from profissionais p
      where p.id = laudos.profissional_id
        and p.user_id = auth.uid()
        and p.ativo
        and p.credencial is not null
    )
  );

-- Sem política de update nem de delete, de propósito. A anterior era `for
-- all` e concedia as duas. Laudo não se edita (o gatilho `laudo_imutavel`
-- da 0008 já barra o conteúdo depois de publicado) e não se apaga: correção
-- é laudo novo apontando para o anterior via `substitui_laudo_id`. Sem
-- política, o Postgres nega — a imutabilidade deixa de depender só do
-- gatilho.
--
-- Nota para quando o Flávio voltar ao assunto: ele respondeu (Q10) que o
-- laudo de um avaliador descredenciado deveria SAIR DO AR. Isso conflita
-- com a imutabilidade decidida nas duas conversas anteriores e com este
-- bloqueio de delete. Se a decisão dele prevalecer, o caminho é uma coluna
-- de visibilidade (`retirado_em` + motivo) que esconde da leitura pública
-- sem apagar a linha — nunca um delete.
