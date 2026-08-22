# Pre-PRD — Banco de talentos da base

**Status:** rascunho para leitura e anotação. Não é especificação final.
**Escrito em:** 22 de agosto de 2026
**Para:** Flávio Barbosa
**De:** Thiago

---

## Como ler este documento

Isto é um **pre-PRD**: a ideia destrinchada até o ponto em que dá pra discordar dela com precisão. Ele registra o que já foi decidido, o que ficou em aberto e o que eu acho que é risco.

O que eu preciso de você:

1. Ler as **decisões tomadas** e dizer onde discorda.
2. Responder o que está marcado como **EM ABERTO — Flávio**. São as coisas que só você sabe.
3. Anotar o que faltou. Este documento vai crescer com o que você souber e eu não.

Nada aqui está construído. Nenhuma linha de código foi escrita para esta ideia.

---

## A ideia em uma frase

Um perfil verificável de cada jovem atleta — ficha, vídeos e avaliação técnica assinada — que clubes e olheiros conseguem encontrar e confiar, sustentado por uma rede de avaliadores que seguem um método único.

A referência é o Sherdog: lá, o valor não está no vídeo da luta, está no cartel que ninguém contesta. Aqui é a mesma aposta — **o ativo é o registro confiável, não o conteúdo**.

---

## Quem usa

| Ator | O que faz | O que ganha |
|---|---|---|
| **Responsável** | Consente, mantém o perfil, contrata aula e avaliação | Filho visto por quem decide, com dado que sustenta |
| **Atleta (7–20)** | Sujeito dos dados. De 16 anos em diante, ganha voz própria no perfil | Porta de entrada que hoje depende de conhecer alguém |
| **Treinador de escolinha** | Cadastra a turma em lote, acompanha os alunos | Comissão por perfil pago, e argumento de matrícula |
| **Avaliador credenciado** | Aplica a rubrica e assina laudos | Renda, e um cartel público próprio |
| **Olheiro / clube** | Busca, filtra, assiste vídeo, manifesta interesse | Encontra talento fora da rede pessoal dele |
| **Equipe (Flávio como CPO)** | Dona da rubrica. Forma, certifica, audita e descredencia | O método vira o ativo da empresa |

---

## Princípios inegociáveis

Estes quatro não são preferência de design. Se algum cair, o produto vira outra coisa — e provavelmente uma coisa pior.

**1. Criança não é vitrine.** A ficha esportiva é pública e indexável; o que identifica e localiza a pessoa não é. Vídeo, nome completo, contato e cidade ficam atrás de olheiro verificado. Local e horário de treino não aparecem para ninguém, nunca.

**2. Não se vende posição, se vende ferramenta.** O ranking da busca lê dado e avaliação. Nunca lê o plano. O olheiro não sabe quem paga — e não deve saber, porque plano num perfil de criança sinaliza renda da família, não talento.

**3. Laudo publicado não se edita.** Correção gera nova versão com a anterior visível. Registro que se reescreve não é registro.

**4. Contato é sempre mediado.** Nenhum adulto de fora recebe canal direto com uma criança. Interesse passa pelo responsável, e a conversa acontece dentro da plataforma.

---

## Decisões já tomadas

| Tema | Decisão | Por quê |
|---|---|---|
| Quem paga | Os dois lados | Família paga serviço, clube paga acesso |
| Visibilidade | Ficha pública; vídeo e identificação atrás de olheiro verificado | Mantém o SEO e o alcance sem expor a criança |
| Faixa etária | Sub-7 a Sub-20 | Volume desde a iniciação; acima de 18 pode abrir mais |
| Alcance | Híbrido — presencial em Fortaleza, online no Brasil | Usa a rede real de vocês sem travar a escala |
| Quem avalia | Qualquer profissional verificado, credenciado por vocês | Vira marketplace de avaliação; tira o Flávio do operacional |
| Papel do Flávio | CPO — dono do método, não executor do volume | O ativo passa a ser a rubrica, não a agenda dele |
| Criação de perfil | Só responsável ou treinador. Nunca aberta | Controle de entrada e cadeia de consentimento |
| Consentimento | Sempre do responsável, com documento, mesmo quando o treinador cadastra | Treinador não pode consentir pelo pai |
| Escolinha | Recebe comissão, não paga | Vira canal de vendas em vez de cliente |
| Free / pago | Free por padrão; pago desbloqueia capacidade | Volume sem venda; conversão por valor entregue |
| Estatística | Só número oficial e conferível. Nada auto-declarado | Dado declarado é publicidade, e o olheiro desconta |

---

## Os cinco domínios

1. **Identidade & Consentimento** — contas, verificação de documento, termo por atleta. É o portão: nada existe sem ele.
2. **Perfil do atleta** — ficha, mídia, histórico, com visibilidade definida por campo.
3. **Avaliação** — rubrica versionada, laudo assinado, marketplace de avaliadores, auditoria.
4. **Descoberta** — busca do olheiro, trilha de visualização, manifestação de interesse.
5. **Serviços** — aulas presenciais e online, agenda, pagamento.

Transversais: pagamentos e repasses, e trilha de auditoria.

---

## O perfil e a visibilidade

A visibilidade é **política por campo, escrita no código** — não é configuração que alguém possa marcar errado. Um campo restrito simplesmente não sai da camada de dados sem o contexto certo.

| Campo | Público / SEO | Só verificado | Nunca |
|---|---|---|---|
| Apelido esportivo ou primeiro nome | ✅ | | |
| Categoria (Sub-13) | ✅ | | |
| Posição, pé dominante, físico | ✅ | | |
| Estatísticas oficiais e competições | ✅ | | |
| Avaliação técnica e quem assinou | ✅ | | |
| Foto de ação, em campo | ✅ | | |
| Clube atual | ✅ | | |
| Estado | ✅ | | |
| Nome completo | | ✅ | |
| Data de nascimento | | ✅ | |
| Cidade | | ✅ | |
| Foto de rosto | | ✅ | |
| **Vídeos** | | ✅ | |
| Contato do responsável | | ✅ | |
| Bairro ou endereço | | | 🚫 |
| Escola | | | 🚫 |
| Local e horário de treino | | | 🚫 |
| Laudo físico, lesão, saúde | | | 🚫 |

Vídeo não é arquivo solto: URL assinada com expiração curta, amarrada à sessão do olheiro verificado, sem download, com cada reprodução registrada. Consentimento revogado mata as URLs.

**Por que essa régua não custa alcance:** o que o Google indexa e o olheiro pesquisa é nome esportivo, categoria, posição, estatística e avaliação assinada. Tudo isso é público. O que fica atrás do login não gera busca de qualquer forma.

---

## Ciclo de vida do perfil

```
rascunho → aguardando consentimento → ativo → suspenso → removido
```

Só `ativo` renderiza em qualquer lugar.

O treinador sobe 200 alunos: os 200 nascem em `aguardando consentimento`, invisíveis. Cada responsável assina com documento e só o perfil dele vira `ativo`. O painel do treinador mostra "187 de 200 assinados" — dado de conversão para vocês, empurrão para ele.

Consentimento revogado derruba para `suspenso` na hora: a página pública passa a responder 410, sai do índice, as URLs de vídeo morrem. `Removido` apaga de verdade, inclusive do CDN.

**Free e pago são plano, não estado.** A máquina de estados governa existência e consentimento; o plano governa capacidade. Eixos separados de propósito — misturar os dois é como se cria vazamento.

| | Free | Pago |
|---|---|---|
| Ficha, categoria, posição, físico | ✅ | ✅ |
| Estatísticas oficiais | ✅ | ✅ |
| Aparece na busca | ✅ | ✅ |
| Posição no ranking | Por dado e avaliação | **Igual** |
| Vídeos | 1 curto | Vários |
| Avaliação técnica | — | Inclusa ou com desconto |
| Evolução no tempo | — | ✅ |
| Ver quem visualizou | — | ✅ |
| Alertas de interesse | — | ✅ |

---

## O motor de avaliação

### A rubrica é o produto

O que se vende não é a opinião do avaliador — é o método que todo avaliador é obrigado a seguir. Sem método comum, dez avaliadores produzem dez escalas e o olheiro não consegue comparar dois atletas.

Quatro eixos:

* **Técnico** — domínio, passe, finalização, 1v1
* **Físico** — velocidade, resistência, coordenação
* **Tático** — leitura de jogo, posicionamento, decisão sob pressão
* **Comportamental** — liderança, disciplina, reação ao erro, relação com o time

Cada item com **âncora descritiva**, não nota solta: *"nota 3 = executa sob pressão de marcação"*. É isso que faz dois avaliadores diferentes chegarem perto no mesmo atleta.

A rubrica é **versionada**. Todo laudo grava a versão em que foi feito, então o método evolui sem invalidar o histórico.

### O laudo

Imutável depois de publicado. Carrega: avaliador e credencial, data, **contexto** (presencial ou análise de vídeo), versão da rubrica, notas por eixo, texto e o que foi observado.

O perfil mostra quantas avaliações existem e o quanto concordam entre si. Três avaliadores independentes convergindo vale muito mais que uma nota alta isolada — e essa convergência é um sinal que só esta plataforma consegue produzir.

### Reputação do avaliador

Duas coisas que não podem virar uma nota só:

**Satisfação de serviço** — o responsável avalia pontualidade, respeito no trato com a criança, clareza da devolutiva. Ele tem competência para julgar isso, e é o que evita avaliador relaxado.

**Qualidade técnica** — o responsável não julga, porque não tem como. Se a nota que o pai dá ao avaliador dependesse da nota que o filho tirou, o avaliador generoso subiria e o rigoroso sumiria. Seria a máquina de inflacionar disfarçada de auditoria.

Quem julga qualidade técnica:

* **Auditoria por amostragem** da equipe, contra a rubrica
* **Concordância entre pares** — dois avaliadores no mesmo atleta, às cegas
* **Distribuição de notas** — curva achatada no topo aparece sozinha
* **Calibração preditiva** — daqui a dois anos se sabe quem progrediu, foi captado, subiu de categoria. Cruzando com quem avaliou e como, mede-se a calibração de cada avaliador

A calibração preditiva é lenta, mas é a única métrica impossível de fraudar — e é o que, em três anos, faz este selo valer mais que o de qualquer concorrente. A rubrica se copia; o histórico não.

### Escada disciplinar

```
sinal automático → revisão de laudos → conversa com a equipe
→ suspensão temporária → descredenciamento
```

Cada degrau registrado, com direito de resposta.

### Cartel do avaliador

O avaliador também tem página pública: número de laudos, tempo de credenciamento, índice de concordância com pares, satisfação de serviço e, quando houver, calibração preditiva. A reputação fica legível, o mercado se autorregula, e o bom avaliador passa a ter um ativo que não quer perder.

### Quando um avaliador é descredenciado

**Decisão tomada:** os laudos dele **saem do ar**, e a plataforma banca uma reavaliação gratuita com outro profissional para cada família afetada.

**Risco anotado:** a exposição é aberta. Um avaliador com 300 laudos vira 300 reavaliações gratuitas de uma vez. O Flávio assume esse risco conscientemente.

> **Sugestão a considerar:** um fundo de garantia. A plataforma retém 2–3% de cada laudo pago num fundo destinado exatamente a bancar reavaliação. O marketplace financia a própria limpeza, e quem é descredenciado deixa o saldo dentro do fundo.

### Os riscos do marketplace aberto

| Risco | Contramedida |
|---|---|
| **Inflação de nota** — quem paga é o pai, o avaliador quer cliente satisfeito, em seis meses todo mundo é nota 9 | Reputação técnica não vem do pai. Vem de auditoria, concordância entre pares, distribuição e calibração |
| **Segurança da criança** — adulto desconhecido com acesso a menor | Identidade verificada e antecedentes. Presencial só com responsável presente. Comunicação só pela plataforma |
| **Conflito de interesse** — avaliador que também é olheiro subvaloriza para captar barato | Vínculo declarado e exibido no laudo. Bloqueio de avaliar atleta ligado a clube com o qual tem vínculo |
| **Qualidade na entrada** — credencial não garante que sabe aplicar a rubrica | Certificação antes de operar. Primeiros laudos revisados antes de publicar |

---

## Aulas e serviços

Presencial em Fortaleza, online para o Brasil. Três trilhas:

* Técnica individual
* Fundamentos
* **Liderança e comportamento esportivo** — a trilha que ninguém mais vende

Instrutor e avaliador são papéis distintos sobre o mesmo cadastro verificado. O mesmo profissional pode ter os dois, com credenciamentos separados: dar aula não habilita a assinar laudo.

**Aula online 1:1 entre adulto e criança** não pode ser tratada como videochamada comum. Sala dentro da plataforma, responsável presente ou sessão gravada e retida por prazo definido, e nenhum canal privado fora dali. Protege a criança e protege o instrutor de acusação.

---

## Descoberta

Filtros: categoria, posição, pé, região, tem avaliação, faixa de nota, tem vídeo, avaliado por quem.

Ordenação por sinal — avaliação, convergência entre avaliadores, riqueza do perfil. Nunca por plano.

**Contato mediado:** o olheiro manifesta interesse → o responsável recebe e decide → abre-se um canal dentro da plataforma. A criança nunca fica exposta a contato direto, o responsável tem controle, e a transação não vaza para fora.

Cada visualização entra na trilha de auditoria, e o responsável vê: *"Fortaleza EC visualizou o perfil do João em 12/03."* Provavelmente o recurso que mais converte plano pago no produto inteiro.

---

## Receita

| Fonte | Quem paga | Observação |
|---|---|---|
| Plano do atleta | Responsável, ~R$10/mês | Free por padrão; pago desbloqueia capacidade |
| Comissão da escolinha | Plataforma repassa | ~R$3 por perfil pago ativo — a escolinha é canal, não cliente |
| Avaliação técnica | Responsável, avulso | Plataforma retém percentual do laudo |
| Aulas | Responsável | Presencial e online, avulso ou pacote |
| Assinatura de clube | Clube ou olheiro | Acesso a busca, filtros e vídeo |

O motor de aquisição é a escolinha: ela cadastra a turma inteira de graça, colhe os consentimentos e ganha comissão sobre quem converte. Não precisa vender nada para entrar.

---

## Faseamento sugerido

Um PRD cobre o produto inteiro; a construção não acontece de uma vez.

**Fase 1 — Fundação.** Contas, consentimento com documento, perfil, ficha pública com SEO, cadastro em lote pelo treinador. Sem vídeo próprio (link não listado do YouTube resolve), sem estatística.

**Fase 2 — O selo.** Rubrica v1, laudo assinado, equipe interna avaliando, página pública do avaliador. Aqui nasce o que diferencia.

**Fase 3 — Descoberta.** Verificação de olheiro, busca, filtros, interesse mediado, trilha de visualização, plano pago. Só faz sentido com volume de perfil já existente.

**Fase 4 — Marketplace e serviços.** Abertura para avaliadores externos, credenciamento, reputação, aulas, agenda, pagamento e repasse de comissão.

---

## Riscos do negócio

| Risco | Nota |
|---|---|
| **Ovo e galinha** | Perfil sem olheiro não vale nada; olheiro sem perfil também não. A escolinha resolve o lado da oferta; o lado da demanda depende da rede do Flávio |
| **Inflação de nota** | O mais provável e o mais letal. Tratado no motor de avaliação |
| **Custo de reavaliação** | Exposição aberta no descredenciamento. Fundo de garantia mitiga |
| **Segurança de menor** | Risco de maior consequência. Um incidente encerra o negócio |
| **Dependência de fonte de estatística** | Sem fonte oficial, o perfil fica sem número. Em aberto |
| **Regulatório** | Vitrine e avaliação credenciada são um negócio. **Representar** atleta é outro, regulado por CBF e FIFA, com restrição maior para menores. O produto não deve prometer intermediação nem cobrar comissão por colocação |

---

## EM ABERTO — Flávio

**1. Origem das estatísticas.** O perfil só exibe número oficial e conferível; não existe estatística auto-declarada. Falta definir a fonte. Caminhos a avaliar: súmula de federação ou liga; integração com quem organiza os campeonatos de base; lançamento por treinador credenciado com responsabilidade sobre o dado; ou registro por avaliador presente no jogo. Até isso fechar, o perfil não exibe estatística.

> Pergunta que ajuda a decidir: em campeonato de base no Ceará hoje, **alguém guarda súmula em formato aproveitável**, ou é papel e planilha solta? A resposta define se isto é integração ou digitalização.

**2. A rubrica.** Os quatro eixos são um esboço. Os itens de cada eixo, a escala e as âncoras descritivas são trabalho seu — e são o ativo da empresa.

**3. Fundo de garantia.** Reter 2–3% de cada laudo para bancar reavaliação de avaliador descredenciado, ou absorver o custo direto?

**4. Certificação de avaliador.** O que alguém precisa comprovar para assinar um laudo? Formação, tempo de quadra, prova prática, curso de vocês?

**5. Preço.** R$10/mês no plano do atleta e R$3 de comissão são chute para dar forma à conta. Quanto custa hoje uma avaliação técnica presencial no mercado de vocês?

**6. Nome do produto.** Não temos.

---

## O que não está decidido e não foi discutido

Deixado de fora de propósito, para não inventar requisito:

* Modalidades além de futsal e futebol
* Aplicativo móvel
* Integração com federações
* Internacionalização
* Ferramenta de gestão para escolinha (chamada, mensalidade, comunicação) — apareceu como possibilidade de receita futura, não foi desenhada
