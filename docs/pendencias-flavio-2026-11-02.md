# Pendências para o Flávio — 02/11/2026

Depois das 21 respostas dele. O que virou código, o que travou, e o que só ele decide.

---

## 1. O bloqueio que apareceu lendo o código

**O termo que o responsável assina promete que o vídeo é restrito. O sistema
publica o vídeo para qualquer um. E o pivô quer vídeo público como produto.**

O termo que está no ar (`apps/web/src/conteudo/termo-2026-08-v1.ts`, versão
`2026-08-v1`) diz, no item 3:

> Disponibilização de nome completo, data de nascimento, cidade, contato e
> vídeos **exclusivamente a olheiros e clubes verificados** pela plataforma.

Mas o bucket de mídia é público (migration `0011_midias.sql`), e a ficha monta
URL pública direta. Hoje, na prática, o vídeo de uma criança seria visível e
indexável por qualquer pessoa.

Isso não é dano ainda: nenhuma criança real está cadastrada. Mas precisa ser
resolvido **antes** dos 60 do Sesc.

São três coisas que não convivem, e ele precisa escolher duas:

| | |
|---|---|
| O termo assinado | vídeo só para olheiro verificado |
| O código de hoje | vídeo público para qualquer visitante |
| O pivô dele | vitrine de vídeo pública como produto de entrada |

Os caminhos possíveis:

- **Vídeo público de verdade.** O termo muda, o pai assina sabendo que o vídeo
  do filho é público e indexável, e revisão jurídica antes de valer. É o que o
  pivô pede.
- **Vídeo restrito de verdade.** O bucket vira privado com URL assinada, e só
  olheiro verificado assiste. Cumpre o termo, mas a vitrine deixa de funcionar
  como cardápio aberto.
- **Meio do caminho.** Foto e ficha públicas, vídeo atrás de login de olheiro
  verificado. A vitrine existe, o vídeo é o que se paga para ver — e isso casa
  com a ideia dele de cobrar acesso do olheiro (Q18).

O próprio arquivo do termo já avisa que o texto **precisa de revisão jurídica
antes de qualquer uso real**. Com o pivô, isso virou urgente.

---

## 2. O que as respostas dele viraram em código

- **Só profissional credenciado assina laudo.** Antes, qualquer conta logada
  publicava avaliação e ainda escolhia, numa lista, qual avaliador apareceria
  assinando — dava para publicar um laudo com o nome dele. Agora cada um assina
  em nome próprio, e a regra está no banco, não na tela.
- **A ficha inverteu.** Vídeo em cima, dados no meio, avaliação por último — e a
  avaliação só aparece se existir, em vez de mostrar um vazio. É o pivô dele:
  cardápio primeiro, avaliação como premium depois.
- **Laudo não se edita nem se apaga** — passou a ser o banco negando, não só um
  gatilho.

---

## 3. Perguntas que precisam de nova resposta

**Q8 — quem aplica o treinamento dos avaliadores.** Ele respondeu outra coisa
(sobre anexar avaliação física e cobrar taxa). A pergunta era: quando houver 30
avaliadores, quem treina cada um no método? Ele mesmo, sempre? Isso vira
gargalo.

**Q9 — como perceber nota inflada.** Ele respondeu que "vai ficar notório nos
vídeos" e que o avaliador perde credibilidade. Isso é consequência, não
mecanismo. Falta: o que auditar, com que frequência, e quem decide. Sem isso,
só se descobre depois que o dano aconteceu.

**Q13 — ele devolveu uma pergunta.** Ficou decidido que a escolinha paga, mas
ele perguntou: o dono pode cadastrar quantos alunos? Preço por faixa (30 / 50 /
ilimitado)? Isso precisa de número antes de virar tela de pagamento.

---

## 4. Onde a resposta dele conflita com algo já decidido

**Q10 — laudo de descredenciado "sai do ar".** Isso quebra a imutabilidade que
foi decidida nas duas conversas e já está no banco. Se a decisão dele
prevalecer, o caminho é esconder da leitura pública com motivo registrado,
nunca apagar — senão o registro deixa de ser aquele que ninguém contesta.
Como o pivô tira o laudo da porta de entrada, isso pode esperar.

**Q18 — cobrar da família para o contato ficar visível.** O plano de agosto já
tinha isso como restrição global: *"Contato é sempre mediado. Nenhum adulto de
fora recebe canal direto com o atleta."* A receita que ele quer sobrevive
inteira se ninguém comprar contato: o olheiro paga para **mandar mensagem**, a
família aceita ou não, e o contato só muda de mão com o sim. Mesmo dinheiro,
sem leilão de visibilidade infantil — e melhor do que o que existe hoje, que
pelas entrevistas dele é o olheiro pegando o Instagram do menino no campo.

---

## 5. O que ele pediu e eu respondo

**Custo inicial e investimento.** Enquanto ninguém paga, é **R$0 por mês** —
só o domínio, uns R$50 por ano. Dá para rodar no plano grátis.

O que define a conta é **vídeo**, não banco:

| Fase | Mês |
|---|---|
| Construir e demonstrar | R$0 |
| Uso contínuo (sem o site dormir) | ~R$140 |
| Quando entrar dinheiro (obrigatório por contrato) | ~R$250 |
| Milhares de atletas | R$1.400 a R$1.900 |

Uma vez só: domínio ~R$50/ano · conta de desenvolvedor Apple ~R$550/ano e
Google ~R$140 (se app nativo, que ele pediu na Q20) · registro de marca no
INPI, algumas centenas por classe.

Não está na conta: meu tempo, o dele, contador, e **advogado para revisar o
termo** — esse último eu recomendo antes de entrar criança real, e o item 1
deste documento é o motivo.

---

## 6. Trabalho que é dele e trava o resto

A rubrica. As respostas dele multiplicaram o tamanho dela:

- **Q3**: a régua muda por categoria — então não é uma rubrica, é uma por faixa
- **Q4**: goleiro precisa de régua própria, e ele já esboçou (base, postura de
  defesa, posicionamento, jogo com os pés, gol/linha, defesa baixa e alta,
  cobertura, orientação)
- **Q1**: ele quer um item de força e porte físico em três níveis (ótima, média,
  baixa) — e a escala de hoje é 1 a 5, então isso muda o formato, não só a lista

Eu **não** mexi no formato da rubrica ainda, de propósito: construir o formato
antes de existir o conteúdo é construir o formato errado. Quando ele escrever a
régua de uma categoria inteira, eu adapto o sistema ao que ele escreveu.

O que ele precisa entregar para destravar: **uma categoria completa** — todos os
itens, com as descrições de cada nível, para uma faixa só (Sub-13, por
exemplo). Com uma pronta, o resto é repetição e eu já sei o formato.
