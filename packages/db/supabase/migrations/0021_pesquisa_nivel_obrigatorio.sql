-- Fecha a pergunta de escolinha x rendimento (0020) para responsável.
--
-- Separada da 0020 por ORDEM DE IMPLANTAÇÃO, não por assunto. A pesquisa
-- está no ar recebendo resposta: se a constraint subisse junto com a
-- coluna, toda resposta de pai seria rejeitada entre o momento da migration
-- e o deploy do front que manda `nivel_filho`. Com as duas separadas, a
-- 0020 sobe primeiro (o front antigo continua inserindo, só sem a coluna
-- nova), o deploy vai depois, e esta aqui fecha a porta no fim.
--
-- `not valid`: as 85 respostas que já chegaram não têm como responder uma
-- pergunta que não existia, e apagá-las ou inventar um valor para elas
-- seria pior. `not valid` deixa as antigas em paz e cobra de toda linha
-- nova — é por isso que a pergunta NÃO entrou em
-- `pesquisa_responsavel_completo`, que é validada.
alter table pesquisa_responsaveis
  add constraint pesquisa_nivel_filho_obrigatorio check (
    perfil <> 'responsavel' or nivel_filho is not null
  ) not valid;
