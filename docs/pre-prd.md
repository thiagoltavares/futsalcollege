# Pre-PRD — Plataforma de reconhecimento da base

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

Uma **plataforma de reconhecimento**: cada jovem atleta ganha um registro verificável do próprio trabalho — ficha, vídeos e avaliação técnica assinada — que mostra onde ele está e onde pode chegar. O olheiro é consequência, não promessa.

A referência é o Sherdog: lá, o valor não está no vídeo da luta, está no cartel que ninguém contesta. Aqui é a mesma aposta — **o ativo é o registro confiável, não o conteúdo**.

### Reconhecimento, não descoberta

Esta é a definição mais importante do documento, e ela reordena tudo.

"Seja descoberto por um clube" é um produto frágil e uma promessa que não se pode cumprir: dos 200 alunos de uma escolinha, talvez 3 sejam vistos por um olheiro. Os outros 197 pagam, esperam, nada acontece e cancelam. Vender vitrine para pai de menino que sonha com o profissional é vender esperança para um público que não tem defesa contra isso.

Reconhecimento entrega para 100%. O responsável que descobre que o menino tem nota alta em técnica e baixa em decisão sob pressão tem o que fazer com isso na segunda-feira. E o menino tem um registro do que ele construiu — assinado por alguém que entende, guardado, visível para a família. Isso tem valor mesmo que olheiro nenhum apareça, que é o desfecho mais provável para quase todos.

Então: **a vitrine não é o motor, é a consequência.** É mais honesto, retém melhor, e resolve o problema de ovo e galinha por outro caminho — os perfis existem porque as famílias querem o reconhecimento, não porque estão esperando um olheiro que talvez nunca venha.

Isso dá sentido ao resto: o pacote de temporada só existe se houver evolução para mostrar, e o rodízio de avaliadores vira "três olhares independentes sobre o desenvolvimento do seu filho".

### Como se fala do produto

A distinção acima não é filosofia — ela define a comunicação. Vale para landing page, anúncio, conversa de venda e discurso de escolinha.

| Pode dizer | Nunca dizer |
|---|---|
| "Reconhecimento do trabalho do seu filho" | "Seu filho vai ser visto por clubes" |
| "Avaliação técnica assinada por quem entende" | "Caminho para o profissional" |
| "Entenda onde ele está e onde pode evoluir" | "Aumente as chances dele" |
| "Clubes e olheiros usam a plataforma para buscar atletas" | "Vamos levar seu filho para um clube" |
| "Registro que acompanha a evolução dele" | Qualquer promessa de resultado, contato ou peneira |

A regra: descreve-se o que a plataforma **faz**, nunca o que o clube **vai fazer**. Prometer contato de clube, além de não se sustentar, aproxima o produto de intermediação de atleta — que é atividade regulada (ver Riscos).

---

## Quem usa

| Ator | O que faz | O que ganha |
|---|---|---|
| **Responsável** | Consente, mantém o perfil, contrata aula e avaliação | Registro do trabalho do filho e leitura de onde ele pode evoluir |
| **Atleta (7–20)** | Sujeito dos dados. De 16 anos em diante, ganha voz própria no perfil | Ter o próprio esforço registrado e reconhecido por quem entende |
| **Treinador de escolinha** | Cadastra a turma em lote, acompanha os alunos | Comissão por perfil pago, e argumento de matrícula |
| **Avaliador credenciado** | Aplica a rubrica e assina laudos | Renda, e um cartel público próprio |
| **Olheiro / clube** | Busca, filtra, assiste vídeo, manifesta interesse | Encontra talento fora da rede pessoal dele |
| **Equipe (Flávio como CPO)** | Dona da rubrica. Forma, certifica, audita e descredencia | O método vira o ativo da empresa |

---

## Princípios inegociáveis

Estes cinco não são preferência de design. Se algum cair, o produto vira outra coisa — e provavelmente uma coisa pior.

**1. Criança não é vitrine.** A ficha esportiva é pública e indexável; o que identifica e localiza a pessoa não é. Vídeo, nome completo, contato e cidade ficam atrás de olheiro verificado. Local e horário de treino não aparecem para ninguém, nunca.

**2. Não se vende posição, se vende ferramenta.** O ranking da busca lê dado e avaliação. Nunca lê o plano. O olheiro não sabe quem paga — e não deve saber, porque plano num perfil de criança sinaliza renda da família, não talento.

**3. Laudo publicado não se edita.** Correção gera nova versão com a anterior visível. Registro que se reescreve não é registro.

**4. Contato é sempre mediado.** Nenhum adulto de fora recebe canal direto com uma criança. Interesse passa pelo responsável, e a conversa acontece dentro da plataforma.

**5. Ranking de criança nunca é público.** Não existe lista dos melhores, nota comparativa entre atletas nem percentil exposto. A avaliação de cada um aparece no perfil dele; a comparação, quando existir, é ferramenta interna do olheiro — nunca página, nunca notificação, nunca conteúdo.

---

## Decisões já tomadas

| Tema | Decisão | Por quê |
|---|---|---|
| Quem paga | Os dois lados | Família paga serviço, clube paga acesso |
| Visibilidade | Ficha pública; vídeo e identificação atrás de olheiro verificado | Mantém o SEO e o alcance sem expor a criança |
| Faixa etária | Sub-7 a Sub-20 | Volume desde a iniciação; acima de 18 pode abrir mais |
| Alcance | Híbrido — presencial em Fortaleza, online no Brasil | Usa a rede real de vocês sem travar a escala |
| Quem avalia | ~~Qualquer profissional verificado~~ — **EM REVISÃO**, ver *Duas empresas, um método* | A direção mudou para avaliação exclusiva da casa. As duas versões estão no documento de propósito |
| Papel do Flávio | CPO — dono do método, não executor do volume | O ativo passa a ser a rubrica, não a agenda dele |
| Criação de perfil | Só responsável ou treinador. Nunca aberta | Controle de entrada e cadeia de consentimento |
| Consentimento | Sempre do responsável, com documento, mesmo quando o treinador cadastra | Treinador não pode consentir pelo pai |
| Escolinha | Recebe comissão, não paga | Vira canal de vendas em vez de cliente |
| Free / pago | Free por padrão; pago desbloqueia capacidade | Volume sem venda; conversão por valor entregue |
| Estatística | Só número oficial e conferível. Nada auto-declarado | Dado declarado é publicidade, e o olheiro desconta |
| Comissão da escolinha | Só sobre o plano do perfil. Nada sobre avaliação | Decisão do Thiago. Em troca, recebe selo de escola credenciada e página própria |
| Posicionamento | **Plataforma de reconhecimento.** O olheiro é consequência, nunca promessa | A vitrine entrega a poucos; o reconhecimento entrega a todos |
| Relatório da família | Perfil com gráficos de evolução, baixável em PDF | Compara a criança com ela mesma, nunca com as outras |
| Pagamentos | Todos dentro da plataforma, com retenção até a entrega | Sem transação registrada não existe laudo, reputação nem reembolso |
| Custo do avaliador | Não paga para trabalhar; só a certificação de entrada | Cobrar do lado da oferta trava o recrutamento |
| Comparar crianças entre si | Não será feito | Vira ranking de criança e monetiza ansiedade. Substituído por referência a critério |
| Trilha de treino | Derivada da rubrica pelo sistema, não escolhida pelo avaliador | Impede que o diagnóstico vire venda |
| Aula e avaliação | O avaliador não ganha nada sobre a aula que decorre do laudo dele | Sem isso, nota baixa vira instrumento de venda |

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

### O loop que sustenta o negócio

```
avaliação → identifica a lacuna → prescreve a trilha → vende a aula
→ reavaliação prova a evolução → renova
```

Este é o motor. É o que faz a família pagar sem promessa de olheiro, o que dá sentido ao pacote de temporada, e o que transforma o laudo de boletim em plano de ação.

**Consequência para a rubrica:** ela deixa de ser uma grade de notas e passa a ser uma **taxonomia de habilidades com treino associado**. Cada item precisa carregar o que fazer quando a nota é baixa — *"passe sob pressão, nota 2 → trilha X, estes exercícios, este período"*. Assim o laudo gera o plano automaticamente, e a aula decorre do diagnóstico em vez de ser empurrada.

É consideravelmente mais trabalho do que uma rubrica de pontuação, e é o ativo real da empresa.

**Risco novo, espelho da inflação de nota:** com a aula amarrada ao laudo, o avaliador ganha motivo para dar nota **baixa**, porque nota baixa gera venda. É o mecânico que diagnostica e conserta.

Duas travas:

* **O avaliador não recebe nada sobre a aula que decorre do laudo dele.** Se receber, o diagnóstico virou venda.
* **A trilha é derivada da rubrica pelo sistema, não escolhida pelo avaliador.** Ele atribui a nota; o plano sai automático. Não há espaço para receitar mais aula do que a nota justifica.

A máquina de reputação já descrita cobre os dois sentidos — a distribuição de notas denuncia quem infla e quem desinfla igualmente.

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

## O relatório para a família

É o produto que a maioria das famílias de fato consome — a vitrine serve a poucos, o relatório serve a todos.

O responsável acessa e baixa o perfil do filho: avaliações, gráficos de evolução por eixo, e — o mais importante — **onde ele pode evoluir**. Linguagem de desenvolvimento, não de julgamento. O que treinar, não o quanto ele vale.

Entregar como PDF com a identidade visual da plataforma e o selo de quem avaliou, não como export técnico. O documento circula no grupo da família e leva a marca junto.

O download não é apenas uma boa funcionalidade: o art. 18 da LGPD garante ao titular o direito de portabilidade. Melhor transformar a obrigação em produto.

### O gráfico compara a criança com ela mesma

Nunca com as outras.

Percentil de criança — *"seu filho está abaixo de 78% da categoria"* — destrói a autoestima de um menino de 11 anos e produz pai insuportável na beira da quadra. Se houver referência de categoria, ela aparece de forma qualitativa, no relatório do responsável, e nunca como ranking público nem na linguagem dirigida à criança.

Isto não é escrúpulo isolado: no dia em que a plataforma virar ranking de crianças, ela deixa de ser um produto que o Flávio possa assinar.

### Sobre comparar com outras crianças

A ideia surgiu como possível funcionalidade futura, no modelo do LinkedIn, que mostra ao candidato como ele se compara aos outros de uma vaga. **Decidido: não será feita.** A razão não é escrúpulo genérico.

O LinkedIn funciona porque são adultos, que escolheram se candidatar, comparados no contexto de uma vaga específica. Nenhuma das três condições existe aqui: a criança não escolheu, não há vaga, e quem lê é o responsável dela.

O que acontece na prática:

* **Vira ranking de crianças.** Não importa que esteja privado no aplicativo do responsável — existir já basta, e contradiz a linha acima.
* **Monetiza ansiedade.** "Assine para ver como seu filho se compara" vende insegurança a um público sem defesa contra isso. Funciona comercialmente, e é por isso mesmo que é perigoso.
* **Piora o comportamento do adulto.** O menino que ouve em casa que está abaixo de 70% da categoria não treina melhor; passa a jogar com medo.
* **LGPD.** Produzir comparação a partir do dado das outras crianças é finalidade que as famílias delas não consentiram, mesmo em forma agregada.

**A pergunta por trás da ideia é legítima e deve ser respondida:** *"meu filho está no caminho?"*

A resposta certa compara contra o **critério da categoria**, não contra as outras crianças:

> "Para o Sub-13, espera-se que o atleta execute o passe sob pressão de marcação. O João está consolidando isso — hoje executa em situação livre, ainda não sob pressão."

Responde a pergunta, é acionável, e não ranqueia ninguém. Em avaliação educacional isso se chama **referenciado a critério**, em oposição a **referenciado a norma** — e a pedagogia abandonou o segundo para crianças pequenas exatamente pelos motivos acima. A rubrica com âncoras descritivas já é, por construção, referenciada a critério.

Comparar atletas entre si é legítimo **do lado do olheiro**: é o trabalho dele, é esperado, e ali existe consentimento para vitrine. Outra tela, outro público, outra finalidade.

---

## Aulas e serviços

Presencial em Fortaleza, online para o Brasil. Três trilhas:

* Técnica individual
* Fundamentos — passe, domínio, finalização, posicionamento
* **Liderança e comportamento esportivo** — a trilha que ninguém mais vende

As aulas não são catálogo solto: **cada trilha é a prescrição de um item da rubrica**. O responsável não escolhe aula num menu, ele contrata o que o laudo apontou. Isso muda a conversa de venda de "quer aula?" para "o João precisa de passe sob pressão; são estas quatro sessões".

Instrutor e avaliador são papéis distintos sobre o mesmo cadastro verificado. O mesmo profissional pode ter os dois, com credenciamentos separados: dar aula não habilita a assinar laudo.

**Aula online 1:1 entre adulto e criança** não pode ser tratada como videochamada comum. Sala dentro da plataforma, responsável presente ou sessão gravada e retida por prazo definido, e nenhum canal privado fora dali. Protege a criança e protege o instrutor de acusação.

---

## Avaliação como funil, ou como produto

Ideia levantada depois do desenho original: **a avaliação sai de graça na compra de um pacote de X aulas**. Faz-se o diagnóstico e, a partir dele, indica-se quais aulas o atleta deve fazer. Cadastro gratuito.

### Por que é forte

Vender pacote de aulas é muito mais fácil que vender avaliação. "Aula de futsal" é categoria que a família já compra e já tem preço na cabeça; "avaliação técnica" é categoria que ela nunca comprou, e metade da conversa vai embora explicando o que é.

Diagnóstico gratuito puxando tratamento pago é o funil mais confiável que existe — dentista, academia, mecânico. O ticket sobe: em vez de uma avaliação avulsa, vendem-se oito aulas. E o banco de perfis se constrói como subproduto, sem custo de aquisição.

### O que ela custa

A avaliação deixa de ser independente. Se ela existe para vender aula, ela estruturalmente existe para vender aula — e o olheiro percebe isso em algum momento.

Repare que isso colide com as duas travas do loop, escritas para impedir que o avaliador receite aula em proveito próprio. Com a plataforma vendendo a aula, **o conflito não desaparece: sobe um andar**, do avaliador para a empresa. E com a direção de *Duas empresas, um método* — em que a avaliação e a aula passam a ser da mesma casa — ele fica ainda mais estrutural.

### A saída: são duas avaliações, não uma

E elas são, naturalmente, produtos diferentes:

| | Diagnóstica | Certificada |
|---|---|---|
| Preço | Gratuita, inclusa no pacote de aulas | Paga, comprada à parte |
| Para quê | Montar o plano de treino | Registro que existe para o mundo de fora |
| Vai ao perfil público | Não | Sim |
| É laudo assinado | Não | Sim |
| Alimenta reputação e histórico | Não | Sim |
| Quem lê | A família e o instrutor | Olheiro, clube, a própria família |

A família entende a diferença sem esforço: *"essa é para a gente saber o que treinar; a outra é a ficha oficial dele."*

Preserva as duas coisas — o funil de aula fica com o diagnóstico gratuito, e o selo continua limpo, porque quem compra o laudo certificado não está comprando aula nenhuma.

**Trava adicional sugerida:** o mesmo profissional não faz as duas para a mesma criança. Quem diagnostica para o plano de aula não é quem assina o registro público.

### O formato do pacote

```
avaliação diagnóstica (grátis) → 8 aulas dirigidas às lacunas → reavaliação
```

A reavaliação no fim é a peça que fecha o ciclo: ela mostra à família **o que mudou**. É o que transforma "paguei oito aulas" em "meu filho evoluiu nisto, nisto e nisto" — e é o que faz comprar o pacote seguinte.

Também é o que dá honestidade ao modelo: se a reavaliação não mostrar evolução, isso aparece. Um produto que pode falhar publicamente é um produto em que se pode confiar.

---

## Duas empresas, um método

Direção nova, posterior ao restante do documento, e a mais estrutural de todas. Ela **revê** a decisão de abrir a avaliação para qualquer profissional verificado.

**O app é horizontal.** Serve todas as escolinhas: perfis, consentimento, registro, relatório, descoberta. Neutro por construção.

**A escola é vertical e separada.** Negócio próprio, onde a metodologia nasce, os avaliadores são formados e as trilhas de treino são testadas antes de virarem produto.

**A avaliação é sempre da casa.** Método próprio, avaliador próprio, selo próprio. Ninguém de fora assina.

### O que essa direção resolve

Some de uma vez: o marketplace a policiar, a certificação de terceiros a manter, o risco de inflação de nota por avaliador externo, a escada disciplinar, a conta aberta do descredenciamento e o fundo de garantia. É uma redução enorme de operação — e o controle sobre a qualidade do método passa a ser total, que é o ponto.

### As duas tensões que ela cria

**1. Teto geográfico.** O app é nacional; a avaliação, se só acontece na escola própria, é de Fortaleza. O selo — que é o ativo — não sai do Ceará, e a plataforma fica sem diferencial em qualquer outra praça.

**2. O canal passa a alimentar um concorrente.** Uma escolinha parceira cadastra 200 alunos e descobre que a avaliação certificada só existe na escola de vocês. O dono dela faz essa conta rápido: *"por que eu mandaria meu aluno ser avaliado na escola do concorrente?"* O canal trava.

### A saída: separar o método do lugar

O que precisa ser da casa é **o avaliador e a metodologia**, não a quadra.

O avaliador de vocês se desloca até a escolinha parceira, aplica o método de vocês e assina como avaliador de vocês. A escola própria segue sendo onde o método nasce e onde os avaliadores são formados — o laboratório — sem ser o único lugar onde a avaliação acontece.

Mantém o controle total sobre a qualidade, mantém o canal funcionando, e o teto passa a ser **quantos avaliadores vocês formam**, não quantas quadras vocês têm.

### O que muda no resto do documento

| Peça | Como fica |
|---|---|
| Marketplace de avaliadores | Deixa de existir. Avaliador é da casa, contratado ou formado por vocês |
| Certificação paga de avaliador | Vira formação interna, não produto |
| Escada disciplinar e descredenciamento | Vira gestão de equipe, não regulação de mercado |
| Fundo de garantia | Perde a razão de ser |
| Cartel público do avaliador | Continua fazendo sentido — dá rosto e autoridade a quem assina |
| Rubrica versionada | Ainda mais central: é o único ativo que sustenta o selo |
| Rodízio de avaliadores no pacote | Continua, dentro da equipe própria |

### Respondido

**Vínculo do avaliador: CLT.** No MVP, o próprio Flávio. Divisão de trabalho: Thiago na técnica, Flávio no método e na quadra.

> **Risco operacional a controlar.** Um único avaliador significa que se pode vender mais avaliação do que se consegue entregar, e agenda com laudo atrasado queima a confiança exatamente no que se está construindo. Defesa simples e obrigatória: **vagas limitadas por mês, visíveis no momento da compra**.

**Escala de avaliadores: não é problema agora.** O Flávio tem rede no mercado para recrutar quando a demanda exigir — e se exigir, é porque já há capital entrando para ele ficar em tempo integral.

**Duas empresas, separadas.** O app não pode parecer propriedade da escola, ou a neutralidade cai por terra junto com o canal. A escola é apenas **um local certificado para realizar avaliações** — a primeira, não a única.

**Teto geográfico: resolvido por etapas.** Validar em Fortaleza, depois replicar por franquia.

> Franquia tem peso jurídico próprio no Brasil — Lei 13.966/2019, com Circular de Oferta de Franquia obrigatória e prazo mínimo de 10 dias antes da assinatura. Não muda nada agora; quando chegar lá, é trabalho de advogado.

---

## Certificação: o modelo Microsoft

**Esta é a resposta para o conflito com o canal**, e vale mais que comissão.

Se a escola própria é *um* centro certificado de avaliação, e não *a* escola, então a escolinha parceira não está alimentando um concorrente — ela está olhando para um caminho que também pode percorrer. Ela se certifica, avalia os próprios alunos com o método da casa, e a plataforma fica com um percentual e com o controle do padrão.

É como Microsoft, Cisco ou AWS operam: a empresa não ministra todos os cursos, ela credencia quem ministra e é dona do exame. **Vocês não avaliam todo mundo — vocês são donos do que significa ser avaliado.**

| | Comissão sobre o aluno | Certificação do centro |
|---|---|---|
| O que a escolinha recebe | Um percentual | Um negócio próprio e um selo |
| Vínculo com o método | Nenhum | Total — ela é auditada por vocês |
| Escala | Linear, limitada pela equipe própria | Cresce com a rede |
| Risco | Ela troca de plataforma por 1% a mais | Ela perde a certificação se sair |

Recomendação: **as duas**, com a comissão servindo de ponte até a certificação existir.

Isso preserva o que a direção *Duas empresas, um método* buscava — controle total sobre a qualidade — sem o teto geográfico e sem transformar o canal em concorrente. E devolve sentido ao cartel público do avaliador: cada laudo mostra quem assinou e por qual centro certificado.

### Como se certifica, e como se fiscaliza

Certificar sem evidência é honra ao mérito. O mecanismo tem quatro peças.

**1. Protocolo padronizado.** Antes de qualquer gravação, a avaliação precisa de roteiro fixo: quais estações, em que ordem, por quanto tempo, o que se observa em cada uma. É o protocolo que torna o laudo de Messejana comparável com o de Juazeiro, e é contra ele que se audita. Sem protocolo, gravação não prova nada — não há padrão de comparação.

**2. Gravação da sessão**, enviada junto com o laudo, como evidência de que o protocolo foi aplicado.

**3. Auditoria por amostragem.** A equipe revê uma fração das sessões contra o protocolo.

**4. Calibração por caso padrão.** Periodicamente, o centro certificado avalia **um vídeo de referência** — o mesmo para toda a rede. A nota dele é comparada com a nota da casa; divergiu, recalibra. Mantém uma rede nacional alinhada sem sair de Fortaleza, e o mesmo vídeo serve de prova de entrada na certificação.

> Também é preciso definir o padrão mínimo de condições: espaço, material, marcação. Se o protocolo exige medida, o centro precisa ter como cumprir.

### A gravação de auditoria é dado sensível de criança

Gravar criança para auditar o método é **finalidade diferente** de tudo o que já foi consentido. Exige consentimento próprio e destacado, e três travas que não podem ser afrouxadas depois:

* **Retenção curta.** A gravação existe para auditar, não para arquivar. Cumprido o fim, apaga. Sugestão: 90 dias.
* **Acesso restrito à equipe de auditoria.** Nunca olheiro, nunca a família, nunca público.
* **Nunca vira conteúdo de perfil.** Se a gravação de auditoria for reaproveitada como vídeo de vitrine, a base legal da coleta foi traída — e o custo não é multa, é a confiança que sustenta o produto inteiro.

### Em aberto nesta direção

* O que uma escolinha precisa cumprir para virar centro certificado? Curso, prova prática, auditoria de laudos, número mínimo de alunos?
* A certificação é da escolinha, do profissional, ou dos dois?
* Percentual da plataforma sobre avaliação feita em centro certificado.
* Recertificação — vale por quanto tempo, e o que faz perder?

---

## O ERP da escolinha

A escolinha parceira ganha "quase um ERP de graça" — é a isca de entrada, e é boa. Mas convém dimensionar: chamada, ficha do aluno, mensalidade e comunicação com pais são quatro módulos, e juntos dão mais trabalho que a plataforma de avaliação inteira. Como escopo de MVP, inviável.

**A versão mínima que já prende, e que se constrói de qualquer forma:**

* Lista de alunos da turma
* Status de consentimento de cada um ("187 de 200 assinados")
* Os laudos da turma reunidos num lugar só
* A página pública da escolinha, com o selo

Isso já entrega organização real sem abrir uma frente nova. Os módulos de gestão de verdade ficam para fase posterior, e provavelmente pagos.

---

## Escolinha própria

Desfecho natural para quem é dono do método: um lugar onde ele é aplicado inteiro. Mas há uma tensão que precisa estar escrita **antes** de acontecer.

**No dia em que a operação abrir uma escolinha em Fortaleza, as escolinhas de Fortaleza deixam de ser canal.** Passa-se a competir com quem alimenta a plataforma de perfis. Não é impeditivo — é escolha de estratégia, e tem hora certa.

Duas coisas diferentes, que não devem ser confundidas:

**Escolinha-laboratório.** Uma só, pequena. Onde o método é testado, os avaliadores são formados e certificados, e as trilhas de treino são validadas antes de virarem produto. Não ameaça parceiro nenhum — ao contrário, dá autoridade ao selo. Faz sentido cedo.

**Escolinha como negócio.** Rede, escala, receita de mensalidade. Aí sim compete com o canal, e só compensa quando a rede de parceiros não for mais o motor de aquisição. Decisão para quando houver números.

As aulas de reforço — passe, posicionamento, liderança — são as mesmas trilhas derivadas da rubrica. A escolinha própria não inventa currículo: ela executa o que o loop de avaliação já prescreve.

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
| Comissão da escolinha | Plataforma repassa | ~R$3 por perfil pago ativo. **Só sobre o plano** |
| Avaliação técnica | Responsável | Plataforma retém percentual do laudo |
| Certificação de avaliador | Avaliador, uma vez | Cobre formação no método e checagem de antecedentes |
| Aulas | Responsável | Presencial e online, avulso ou pacote |
| Assinatura de clube | Clube ou olheiro | Acesso a busca, filtros e vídeo |

O motor de aquisição é a escolinha: ela cadastra a turma inteira de graça, colhe os consentimentos e ganha comissão sobre quem converte para o plano pago. Não precisa vender nada para entrar.

**A escolinha não participa da receita de avaliação.** Decisão tomada. O que ela ganha em troca não é dinheiro:

* **Selo de escola credenciada**, com página própria no site. Só funciona se tiver critério — número de alunos com perfil ativo, alunos avaliados, professor certificado no método. Selo que todos ganham vira ruído. Com critério, vira algo que ela exibe na porta e usa na matrícula.
* **SEO de graça.** A página dela ranqueia pelo domínio da plataforma — "escolinha de futsal em Messejana" é busca que ela nunca ganharia sozinha.
* **Uma ferramenta para entregar aos pais.** O relatório de evolução é argumento de retenção e de matrícula dela, produzido por vocês.

Consequência a monitorar: reconhecimento é moeda real para escolinha pequena, mas provavelmente não é suficiente para que ela ceda a quadra, organize um dia inteiro e mobilize 30 famílias. Para destravar a avaliação de turma sem dar percentual, o caminho é **cachê fixo por dia** — ela organiza, recebe valor fechado.

O avaliador não paga nada para trabalhar. Cobra-se apenas a certificação de entrada, e mesmo essa provavelmente deve ser gratuita nos primeiros meses, para recrutar os primeiros avaliadores.

---

## Pagamentos

**Todo pagamento acontece dentro da plataforma.** Não é preferência, é estrutural:

* **O laudo nasce da transação.** Pagamento por fora significa nenhum registro — e sem registro não existe reputação de avaliador, rodízio, calibração preditiva nem histórico. Perde-se o produto, não apenas a comissão.
* **As promessas dependem de controlar o dinheiro.** A reavaliação gratuita no descredenciamento e o fundo de garantia só existem se o valor passa pela plataforma.
* **Pagamento por fora é contato direto**, e contato direto fura o princípio de mediação que protege a criança.

### O que isso obriga a construir

Aceitar pagamento é simples. Repassar a terceiros é o trabalho — a operação vira um marketplace com split.

* **Split de pagamento** — exige PSP com suporte a repasse. No Brasil: Asaas, Iugu ou Pagar.me. PIX como trilho principal (custo baixo, sem chargeback); cartão para a recorrência do plano.
* **Três fluxos distintos** — assinatura recorrente (plano), transação avulsa (avaliação, aula) e repasse periódico (avaliador, escolinha). São três máquinas, não uma.
* **Retenção até a entrega** — o avaliador não recebe no ato da compra. O valor fica retido até o laudo ser publicado e vencer uma janela de contestação (sugestão: 7 dias). É isso que dá poder de reembolso, e é de onde sai o fundo de garantia.
* **O pagador é sempre o responsável.** Menor de idade não é titular de nada.

### Vazamento para fora da plataforma

Risco clássico de marketplace de serviço presencial: responsável e avaliador se conhecem no primeiro encontro e combinam o segundo por fora.

**Na avaliação, o desenho já resolve.** O produto não é a hora do avaliador, é o laudo. Pagou por fora, não há laudo assinado: não entra no perfil, não conta para a reputação do avaliador, não aparece para o olheiro. O bypass compra uma conversa; a plataforma vende o registro.

**Na aula, o risco é real** — o responsável quer o treino, e o treino acontece igual por fora. A defesa é conveniência (agenda, pagamento, remarcação, histórico) somada ao vínculo do instrutor com o próprio credenciamento.

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
| **Deflação de nota** | Espelho da inflação: com aula amarrada ao laudo, nota baixa gera venda. Tratado com as duas travas do loop |
| **Conflito com o canal** | Escolinha própria compete com as escolinhas parceiras. Laboratório não; rede sim |
| **Regulatório** | Vitrine e avaliação credenciada são um negócio. **Representar** atleta é outro, regulado por CBF e FIFA, com restrição maior para menores. O produto não deve prometer intermediação nem cobrar comissão por colocação |

---

## EM ABERTO — Flávio

**1. Origem das estatísticas.** O perfil só exibe número oficial e conferível; não existe estatística auto-declarada. Falta definir a fonte. Caminhos a avaliar: súmula de federação ou liga; integração com quem organiza os campeonatos de base; lançamento por treinador credenciado com responsabilidade sobre o dado; ou registro por avaliador presente no jogo. Até isso fechar, o perfil não exibe estatística.

> Pergunta que ajuda a decidir: em campeonato de base no Ceará hoje, **alguém guarda súmula em formato aproveitável**, ou é papel e planilha solta? A resposta define se isto é integração ou digitalização.

**2. A rubrica.** Os quatro eixos são um esboço. Os itens de cada eixo, a escala e as âncoras descritivas são trabalho seu — e são o ativo da empresa.

**3. Fundo de garantia.** Reter 2–3% de cada laudo para bancar reavaliação de avaliador descredenciado, ou absorver o custo direto?

**4. Certificação de avaliador.** O que alguém precisa comprovar para assinar um laudo? Formação, tempo de quadra, prova prática, curso de vocês?

**5. Preço.** R$10/mês no plano do atleta e R$3 de comissão são chute para dar forma à conta. Quanto custa hoje uma avaliação técnica presencial no mercado de vocês?

**6. Quem define o preço da avaliação.** Três modelos:

* **Preço de tabela** — a plataforma vende por um valor único e repassa ao avaliador. O laudo vale o mesmo independente de quem assinou, o rodízio de avaliadores funciona, e a marca do selo é da plataforma. Exige acertar o preço sem dados.
* **Preço do avaliador** — cada um define o seu, a plataforma cobra taxa. Escala sozinho e atrai nome grande, mas o mercado aprende rápido que preço é sinal de qualidade: família com dinheiro compra o laudo caro, e o olheiro passa a ler o valor pago como proxy de talento. Recria, do lado da avaliação, exatamente o que foi proibido do lado do plano — vender posição. **Não recomendado.**
* **Faixas por credenciamento** — a plataforma define 2 ou 3 faixas e o avaliador sobe por critério auditável (volume, concordância, calibração). Preço previsível, rodízio preservado, e dá ao avaliador um jeito de ganhar mais **sem inflacionar nota** — o incentivo mais saudável do modelo.

> Recomendação: preço de tabela agora, faixas quando a rede amadurecer. Hoje não há dado para calibrar faixa.

**7. Como a avaliação é empacotada.** Avulsa, pacote de temporada ou avaliação de turma — e possivelmente mais de um formato. Depende do Flávio.

* **Avulsa** — menor atrito de entrada, receita imprevisível, e sozinha não gera série temporal.
* **Pacote de temporada** — 3 avaliações no ano com relatório de evolução. Receita previsível, e é a série temporal que alimenta a calibração preditiva. Se cada avaliação do pacote sair com um **avaliador diferente**, ganha-se concordância entre pares de graça e combate-se a inflação de nota sem custo de auditoria.
* **Avaliação de turma** — o avaliador se desloca uma vez e avalia a turma inteira no mesmo dia. Custo logístico por laudo despenca e gera muitos perfis verificados de uma vez. Depende de resolver o incentivo da escolinha (ver Receita).

**8. Modelo fiscal do repasse.** Decisão de contador, não de produto, mas muda a arquitetura de pagamento:

* **Intermediação** — o avaliador presta o serviço ao responsável; a plataforma emite nota apenas sobre a comissão. Menos imposto, exige contrato claro e que o avaliador emita a própria nota.
* **Revenda** — a plataforma vende o serviço e contrata o avaliador. Nota cheia, imposto sobre o bruto, mais simples para o cliente.

**9. Aplicativo móvel.** Apareceu na conversa como "app confiável onde o pai baixa o perfil do filho". Não foi desenhado. A decidir: web responsiva resolve o relatório e o download, ou o app é requisito de confiança para o público de pais?

**10. Critério do selo de escola credenciada.** O que uma escolinha precisa cumprir para receber o selo e a página própria? Quantos alunos ativos, quantos avaliados, professor certificado?

**11. Nome do produto.** Não temos.

---

## Histórico da ideia

A ideia se moveu bastante durante a conversa, e o registro dessas viradas vale tanto quanto as conclusões. Nada aqui foi apagado do documento — decisões substituídas continuam no texto, marcadas.

| # | Era | Virou | Por quê |
|---|---|---|---|
| 1 | Perfil público completo, tipo Sherdog | Ficha pública; vídeo e identificação atrás de olheiro verificado | Página indexada de menor com rosto, nome e localização é ferramenta de localização de criança |
| 2 | Estatística declarada pelo responsável, marcada como não verificada | Só número oficial e conferível, ou nenhum | Dado declarado é publicidade — o olheiro desconta, e o perfil perde credibilidade junto |
| 3 | Escolinha paga por aluno | Escolinha recebe comissão sobre o plano | Ela pagava o custo e outro colhia o benefício. Invertido, vira canal de vendas |
| 4 | Escolinha ganha percentual da avaliação | Não ganha nada da avaliação; ganha selo, página própria e SEO | Decisão do Thiago |
| 5 | Vitrine como produto — "seja descoberto" | **Plataforma de reconhecimento**; o olheiro é consequência | A vitrine entrega a poucos e frustra o resto. Reconhecimento entrega a todos |
| 6 | Comparação entre crianças, no modelo LinkedIn | Descartada. Referência a critério da categoria no lugar | Vira ranking de criança e monetiza ansiedade dos pais |
| 7 | Marketplace aberto de avaliadores verificados | Avaliação sempre da casa, avaliador CLT | Controle total do método, e some a operação de policiar terceiros |
| 8 | Avaliação como produto pago avulso | Diagnóstica grátis no pacote **+** certificada paga à parte | O funil de aula precisa de porta de entrada; o selo precisa de independência |
| 9 | Escola própria como destino único da avaliação | Escola como **primeiro centro certificado**, modelo Microsoft | Resolve o teto geográfico e o conflito com o canal de uma vez |

---

## O que não está decidido e não foi discutido

Deixado de fora de propósito, para não inventar requisito:

* Modalidades além de futsal e futebol
* Integração com federações
* Internacionalização
* Ferramenta de gestão para escolinha (chamada, mensalidade, comunicação) — apareceu como possibilidade de receita futura, não foi desenhada
