import path from "node:path";
import { agruparPorEixo, EIXOS, ROTULO_EIXO, type Eixo, type ItemRubrica } from "@futsalcollege/core";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Sem hifenização automática: o dicionário padrão do @react-pdf/renderer é
// em inglês e quebra palavra em português em lugar errado (ex.: "avalia-
// ção"). Devolver a palavra inteira desliga a hifenização — o texto só
// quebra em espaço, como o resto do produto.
Font.registerHyphenationCallback((palavra) => [palavra]);

// Fontes da marca versionadas no repositório (apps/web/src/pdf/fonts) — o
// mesmo par que a tela usa via next/font/google (Big Shoulders + Barlow,
// ver apps/web/src/ui/estilos.css) — para o PDF não depender de rede em
// tempo de renderização. @react-pdf/renderer usa fontkit por baixo, que
// não lida bem com fonte variável: os .ttf aqui são instâncias estáticas
// (peso fixo), não a fonte variável que o Google Fonts serve por padrão
// hoje para "Big Shoulders".
const pastaFontes = path.join(process.cwd(), "src/pdf/fonts");

Font.register({
  family: "Big Shoulders",
  fonts: [
    { src: path.join(pastaFontes, "BigShoulders-Bold.ttf"), fontWeight: 700 },
    { src: path.join(pastaFontes, "BigShoulders-ExtraBold.ttf"), fontWeight: 800 },
  ],
});

Font.register({
  family: "Barlow",
  fonts: [
    { src: path.join(pastaFontes, "Barlow-Regular.ttf"), fontWeight: 400 },
    { src: path.join(pastaFontes, "Barlow-Medium.ttf"), fontWeight: 500 },
    { src: path.join(pastaFontes, "Barlow-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(pastaFontes, "Barlow-Bold.ttf"), fontWeight: 700 },
  ],
});

// ---------------------------------------------------------------------
// Paleta da marca (apps/web/src/ui/estilos.css, bloco `.fc`) — os mesmos
// valores, para o PDF e a tela nunca divergirem.
// ---------------------------------------------------------------------
const COR = {
  tinta: "#0b0d0e", // --fc-ink: fundo da faixa de cabeçalho
  texto: "#14171a", // --fc-tinta: cor de leitura do corpo, sobre osso/branco
  texto80: "rgba(20, 23, 26, 0.8)",
  texto60: "rgba(20, 23, 26, 0.6)",
  texto40: "rgba(20, 23, 26, 0.4)",
  osso: "#f4f0e8", // --fc-osso: fundo da página
  branco: "#fffdf9", // --fc-branco: cartões sobre o fundo osso
  ossoTexto: "#f4f0e8",
  ossoTexto70: "rgba(244, 240, 232, 0.7)",
  ossoTexto45: "rgba(244, 240, 232, 0.45)",
  acento: "#ff3b14", // --fc-gol-forte
  linha: "rgba(20, 23, 26, 0.14)",
  linhaForte: "rgba(20, 23, 26, 0.28)",
  faixaOsso: "rgba(244, 240, 232, 0.14)",
  faixaOssoBorda: "rgba(244, 240, 232, 0.22)",
  barraVazia: "rgba(20, 23, 26, 0.09)",
} as const;

// Cor por eixo — mesma função que no radar da ficha pública e no
// formulário de avaliação: técnico reaproveita o "gol" (pilar central da
// marca), os outros três têm tons próprios da mesma família de peso.
const COR_EIXO: Record<Eixo, string> = {
  tecnico: "#c62f0d",
  fisico: "#0b6d63",
  tatico: "#2a4a8f",
  comportamental: "#7a3f7a",
};

const estilos = StyleSheet.create({
  documento: {
    fontFamily: "Barlow",
    fontSize: 9.5,
    color: COR.texto,
    backgroundColor: COR.osso,
    // O rodapé é `fixed` e posicionado de forma absoluta, então ele não empurra
    // conteúdo nenhum. Quem reserva o espaço dele é o padding do PRÓPRIO `Page`:
    // padding de View filha só se aplica uma vez, no fim de todo o fluxo, e não
    // em cada página — foi por isso que a primeira página escorria por baixo do
    // rodapé, cortando barra e âncora do último item.
    paddingBottom: 86,
  },

  // ---------- cabeçalho ----------
  faixa: {
    backgroundColor: COR.tinta,
    paddingHorizontal: 40,
    paddingTop: 34,
    paddingBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: COR.acento,
  },
  faixaEyebrow: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 8,
    letterSpacing: 1.6,
    color: COR.acento,
    marginBottom: 10,
  },
  nomeAtleta: {
    fontFamily: "Big Shoulders",
    fontWeight: 800,
    fontSize: 42,
    lineHeight: 0.95,
    letterSpacing: -0.5,
    textTransform: "uppercase",
    color: COR.ossoTexto,
  },
  tagsLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  tag: {
    borderWidth: 1,
    borderColor: COR.faixaOssoBorda,
    backgroundColor: COR.faixaOsso,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagTexto: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COR.ossoTexto70,
  },

  // ---------- corpo ----------
  corpo: {
    paddingHorizontal: 40,
    paddingTop: 26,
  },
  rotuloSecao: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 8,
    letterSpacing: 1.4,
    color: COR.texto40,
    marginBottom: 4,
  },
  fraseComparacao: {
    fontFamily: "Barlow",
    fontSize: 10,
    lineHeight: 1.4,
    color: COR.texto60,
    maxWidth: 420,
  },

  // ---------- eixo ----------
  eixoBloco: {
    marginTop: 22,
  },
  eixoCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
  },
  eixoMarcador: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 7,
  },
  eixoTitulo: {
    fontFamily: "Big Shoulders",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // ---------- item ----------
  item: {
    marginBottom: 11,
  },
  itemTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 5,
  },
  itemRotulo: {
    flex: 1,
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 10.5,
    color: COR.texto,
  },
  notaBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notaBadgeTexto: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 9,
  },
  barraFundo: {
    flexDirection: "row",
    marginBottom: 5,
  },
  barraCelula: {
    flex: 1,
    height: 5,
    borderRadius: 2,
    marginRight: 3,
  },
  ancora: {
    fontFamily: "Barlow",
    fontSize: 9,
    lineHeight: 1.4,
    color: COR.texto60,
  },
  ancoraSemNota: {
    fontFamily: "Barlow",
    fontWeight: 500,
    fontSize: 9,
    lineHeight: 1.4,
    color: COR.texto40,
  },

  // ---------- observações ----------
  observacoes: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COR.linha,
  },
  observacoesTitulo: {
    fontFamily: "Big Shoulders",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: COR.texto,
    marginBottom: 8,
  },
  observacoesTexto: {
    fontFamily: "Barlow",
    fontSize: 10,
    lineHeight: 1.6,
    color: COR.texto80,
  },

  // ---------- assinatura ----------
  assinatura: {
    marginTop: 26,
    backgroundColor: COR.branco,
    borderWidth: 1,
    borderColor: COR.linha,
    borderRadius: 6,
    padding: 16,
  },
  assinaturaEyebrow: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: COR.acento,
    marginBottom: 10,
  },
  assinaturaGrade: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  assinaturaColuna: {
    width: "50%",
    marginBottom: 10,
    paddingRight: 10,
  },
  assinaturaRotulo: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: COR.texto40,
    marginBottom: 2,
  },
  assinaturaValor: {
    fontFamily: "Barlow",
    fontWeight: 600,
    fontSize: 10.5,
    color: COR.texto,
  },
  assinaturaSub: {
    fontFamily: "Barlow",
    fontSize: 8.5,
    color: COR.texto60,
    marginTop: 1,
  },

  // ---------- rodapé (fixo em toda página) ----------
  rodape: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 0.75,
    borderTopColor: COR.linhaForte,
    backgroundColor: COR.osso,
  },
  rodapeFrase: {
    fontFamily: "Barlow",
    fontWeight: 500,
    fontSize: 8,
    lineHeight: 1.4,
    color: COR.texto60,
    marginBottom: 5,
  },
  rodapeMetaLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  rodapeMeta: {
    fontFamily: "Barlow",
    fontSize: 7.5,
    color: COR.texto40,
  },
});

export type DadosLaudo = {
  apelido: string;
  categoria: string;
  posicao?: string | null;
  escolinhaNome?: string | null;
  contexto: string;
  avaliador: string;
  avaliadorCredencial?: string | null;
  avaliadorLocal?: string | null;
  rubricaVersao: string;
  publicadoEm: string;
  itens: ItemRubrica[];
  notas: Record<string, number>;
  texto?: string | null;
};

/** Âncora descritiva da nota do item — "" com nota fora de 1-5 não deveria existir (a rubrica é `strict()`), mas o laudo é dado externo: cai no rótulo de "sem nota" em vez de estourar. */
function ancoraDoItem(item: ItemRubrica, nota: number | undefined): string {
  if (!nota) return "Ainda não avaliado neste laudo.";
  const chave = String(nota) as "1" | "2" | "3" | "4" | "5";
  return item.ancoras[chave] ?? "Ainda não avaliado neste laudo.";
}

export function LaudoPDF({ dados }: { dados: DadosLaudo }) {
  const grupos = agruparPorEixo(dados.itens);
  const temObservacoes = Boolean(dados.texto && dados.texto.trim().length > 0);

  const fraseComparacao = `A avaliação compara ${dados.apelido} com o critério da categoria ${dados.categoria} — nunca com outro atleta.`;

  return (
    <Document title={`Avaliação técnica — ${dados.apelido}`}>
      <Page size="A4" style={estilos.documento}>
        <View style={estilos.faixa}>
          <Text style={estilos.faixaEyebrow}>AVALIAÇÃO TÉCNICA · FUTSAL COLLEGE</Text>
          <Text style={estilos.nomeAtleta}>{dados.apelido}</Text>
          <View style={estilos.tagsLinha}>
            <View style={estilos.tag}>
              <Text style={estilos.tagTexto}>{dados.categoria}</Text>
            </View>
            {dados.posicao && (
              <View style={estilos.tag}>
                <Text style={estilos.tagTexto}>{dados.posicao}</Text>
              </View>
            )}
            <View style={estilos.tag}>
              <Text style={estilos.tagTexto}>{dados.escolinhaNome ?? "Atleta independente"}</Text>
            </View>
          </View>
        </View>

        <View style={estilos.corpo}>
          <Text style={estilos.rotuloSecao}>POR QUE ESTA NOTA VALE</Text>
          <Text style={estilos.fraseComparacao}>{fraseComparacao}</Text>

          {EIXOS.filter((eixo) => grupos[eixo].length > 0).map((eixo) => {
            const cor = COR_EIXO[eixo];
            return (
              <View key={eixo} style={estilos.eixoBloco}>
                {/* Cabeçalho do eixo e o PRIMEIRO item vão juntos, num bloco que
                    não quebra: senão o título ("TÁTICO") fica órfão no pé de uma
                    página e os itens dele começam na seguinte. `minPresenceAhead`
                    sozinho não segurou — grudar os dois resolve de vez. */}
                {grupos[eixo].map((item, indice) => {
                  const nota = dados.notas[item.chave];
                  return (
                    <View key={item.chave} style={estilos.item} wrap={false}>
                      {indice === 0 && (
                        <View style={estilos.eixoCabecalho}>
                          <View style={[estilos.eixoMarcador, { backgroundColor: cor }]} />
                          <Text style={[estilos.eixoTitulo, { color: cor }]}>
                            {ROTULO_EIXO[eixo]}
                          </Text>
                        </View>
                      )}
                      <View style={estilos.itemTopo}>
                        <Text style={estilos.itemRotulo}>{item.rotulo}</Text>
                        <View
                          style={[
                            estilos.notaBadge,
                            { backgroundColor: nota ? cor : COR.barraVazia },
                          ]}
                        >
                          <Text
                            style={[
                              estilos.notaBadgeTexto,
                              { color: nota ? COR.ossoTexto : COR.texto40 },
                            ]}
                          >
                            {nota ?? "–"}
                          </Text>
                        </View>
                      </View>
                      <View style={estilos.barraFundo}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <View
                            key={n}
                            style={[
                              estilos.barraCelula,
                              n === 5 ? { marginRight: 0 } : undefined,
                              { backgroundColor: nota && n <= nota ? cor : COR.barraVazia },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={nota ? estilos.ancora : estilos.ancoraSemNota}>
                        {ancoraDoItem(item, nota)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {temObservacoes && (
            <View style={estilos.observacoes}>
              <Text style={estilos.observacoesTitulo}>Observações do avaliador</Text>
              <Text style={estilos.observacoesTexto}>{dados.texto}</Text>
            </View>
          )}

          <View style={estilos.assinatura} wrap={false}>
            <Text style={estilos.assinaturaEyebrow}>ASSINATURA TÉCNICA</Text>
            <View style={estilos.assinaturaGrade}>
              <View style={estilos.assinaturaColuna}>
                <Text style={estilos.assinaturaRotulo}>Avaliador</Text>
                <Text style={estilos.assinaturaValor}>{dados.avaliador}</Text>
                {dados.avaliadorCredencial && (
                  <Text style={estilos.assinaturaSub}>{dados.avaliadorCredencial}</Text>
                )}
              </View>
              <View style={estilos.assinaturaColuna}>
                <Text style={estilos.assinaturaRotulo}>Centro</Text>
                <Text style={estilos.assinaturaValor}>{dados.avaliadorLocal ?? "—"}</Text>
              </View>
              <View style={estilos.assinaturaColuna}>
                <Text style={estilos.assinaturaRotulo}>Contexto</Text>
                <Text style={estilos.assinaturaValor}>{dados.contexto}</Text>
              </View>
              <View style={estilos.assinaturaColuna}>
                <Text style={estilos.assinaturaRotulo}>Data de publicação</Text>
                <Text style={estilos.assinaturaValor}>{dados.publicadoEm}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={estilos.rodape} fixed>
          <Text style={estilos.rodapeFrase}>{fraseComparacao}</Text>
          <View style={estilos.rodapeMetaLinha}>
            <Text style={estilos.rodapeMeta}>
              Rubrica {dados.rubricaVersao} · Publicado em {dados.publicadoEm} · Futsal College
            </Text>
            <Text
              style={estilos.rodapeMeta}
              render={({ pageNumber, totalPages }) =>
                totalPages > 1 ? `Página ${pageNumber} de ${totalPages}` : ""
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
