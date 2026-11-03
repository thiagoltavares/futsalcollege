/**
 * Texto do termo, versionado junto com o código. A versão fica gravada em
 * `consentimentos.versao_termo`: quando o texto mudar, dá para saber exatamente
 * o que cada responsável aceitou.
 *
 * ATENÇÃO: este texto precisa de revisão jurídica antes de qualquer uso real.
 *
 * CONFLITO ABERTO, não resolver sozinho. O item 3 abaixo promete ao
 * responsável que os vídeos do filho vão "exclusivamente a olheiros e clubes
 * verificados". O sistema não cumpre isso: o bucket `midias` é PÚBLICO
 * (migration 0011, decisão explícita daquela rodada para a demonstração não
 * depender de URL assinada), e a ficha pública monta URL direta com
 * `getPublicUrl`. Na prática, hoje o vídeo seria visível e indexável por
 * qualquer visitante.
 *
 * Nenhuma criança real está cadastrada, então ainda não houve dano — mas isto
 * precisa ser resolvido ANTES do primeiro cadastro real. E a direção nova do
 * produto (vitrine de vídeo pública como porta de entrada) vai na direção
 * oposta do que este texto promete: ou o termo muda e o responsável assina
 * sabendo que o vídeo é público, ou o vídeo deixa de ser público. As duas
 * coisas não convivem.
 *
 * Quem for mexer aqui: mudar o texto exige versão nova (`VERSAO_TERMO`), não
 * edição desta — `consentimentos.versao_termo` existe justamente para provar
 * o que cada responsável aceitou, e quem já assinou aceitou ESTE texto.
 */
export const VERSAO_TERMO = "2026-08-v1";

export const TERMO = `
Eu, responsável legal pelo atleta identificado neste cadastro, autorizo o
tratamento dos dados pessoais dele pela plataforma, para as seguintes
finalidades:

1. Manutenção de uma ficha esportiva pública, contendo apelido, categoria,
   posição, pé dominante, altura, peso, clube atual e estado.
2. Registro de avaliações técnicas assinadas por avaliador credenciado.
3. Disponibilização de nome completo, data de nascimento, cidade, contato e
   vídeos exclusivamente a olheiros e clubes verificados pela plataforma.

Declaro estar ciente de que:

- Bairro, endereço, escola, local e horário de treino não são coletados.
- Dados de saúde, quando houver, exigem autorização específica e nunca são
  públicos.
- Esta autorização pode ser revogada a qualquer momento, e a revogação retira
  a ficha do ar imediatamente.
`.trim();
