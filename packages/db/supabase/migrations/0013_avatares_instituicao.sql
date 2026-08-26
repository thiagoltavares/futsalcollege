-- Avatar de escolinha e de profissional — mesmo raciocínio de `atleta_midias
-- .storage_path` (migration 0011): guarda o caminho dentro do bucket
-- `midias`, não a URL completa, porque a URL pública é montada em runtime
-- (varia por ambiente, local vs. produção). Sem tabela própria aqui — ao
-- contrário do atleta, nem escolinha nem profissional têm galeria; é uma
-- imagem só, então uma coluna na própria linha basta.
--
-- Nenhuma política nova: `escolinhas_leitura_publica` e
-- `profissionais_leitura_publica` (migrations 0009 e 0010) já liberam
-- leitura pública de "true" — a coluna nova sai de graça pela mesma
-- política, mesma régua de "nome, cidade, UF, credencial" já público hoje.
-- Nenhuma escrita pública das duas tabelas (seed roda como service role,
-- que ignora RLS) — não há política de update a redigir aqui.
alter table escolinhas add column foto_storage_path text;
alter table profissionais add column foto_storage_path text;
