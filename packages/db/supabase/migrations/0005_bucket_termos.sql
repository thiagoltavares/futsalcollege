-- Documento de identidade do responsável. Bucket privado: nada aqui é servido
-- publicamente, e o acesso sai por URL assinada de vida curta.
insert into storage.buckets (id, name, public)
values ('termos', 'termos', false)
on conflict (id) do nothing;

create policy termos_envio_do_responsavel on storage.objects
  for insert
  with check (bucket_id = 'termos' and owner = auth.uid());

create policy termos_leitura_do_responsavel on storage.objects
  for select
  using (bucket_id = 'termos' and owner = auth.uid());
