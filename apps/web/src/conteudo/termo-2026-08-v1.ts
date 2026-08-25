/**
 * Texto do termo, versionado junto com o código. A versão fica gravada em
 * `consentimentos.versao_termo`: quando o texto mudar, dá para saber exatamente
 * o que cada responsável aceitou.
 *
 * ATENÇÃO: este texto precisa de revisão jurídica antes de qualquer uso real.
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
