-- Achado de review (Tarefa 10): se o upload do documento em `termos` for
-- bem-sucedido mas o insert seguinte em `consentimentos` falhar, o arquivo
-- fica órfão no bucket — ninguém aponta para ele, mas ele continua lá. A
-- correção na action (`assinarConsentimento`) chama
-- `storage.from("termos").remove([...])` nesse caso, no mesmo padrão de
-- rollback compensatório já usado para o insert de `atleta_identificacao`
-- em `painel/novo/acoes.ts`.
--
-- Mas a migration 0005 só concedeu insert e select em `storage.objects` para
-- o bucket `termos` — sem política de delete, a RLS nega por padrão (mesmo
-- comentário de 0003 vale aqui: "sem política, nega"). Sem uma política de
-- delete, aquele `.remove()` da action é rejeitado pela RLS e falha em
-- silêncio (o client de storage devolve `error`, que a action não lê no
-- caminho de rollback) — o arquivo continua órfão, só que agora com uma
-- linha de código que dá a falsa impressão de já ter limpado.
--
-- Uma política de delete "for all" para o dono, como a que existia por
-- engano em `consentimentos` antes de 0003, reabriria o problema que 0003
-- corrigiu: um responsável conseguiria apagar o PRÓPRIO documento depois de
-- ele já estar referenciado por um `consentimentos` com `documento_url`
-- apontando para ele — a linha em `consentimentos` continuaria existindo
-- (é prova, não se apaga, ver 0003), mas passaria a apontar para um arquivo
-- que não existe mais. Documento sumido não é diferente, na prática, de
-- prova apagada.
--
-- Por isso a política abaixo é estreita: só permite apagar um objeto do
-- bucket `termos` que pertence ao responsável E que NENHUM consentimento
-- referencia (via `documento_url = 'termos/' || objects.name`). Um arquivo
-- órfão pode ser apagado pelo próprio dono; um arquivo com consentimento
-- vigente ou já revogado nunca pode.
create policy termos_delete_de_arquivo_orfao on storage.objects
  for delete
  using (
    bucket_id = 'termos'
    and owner = auth.uid()
    and not exists (
      select 1
      from consentimentos c
      where c.documento_url = 'termos/' || storage.objects.name
    )
  );
