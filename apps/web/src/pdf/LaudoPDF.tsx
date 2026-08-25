import { agruparPorEixo, EIXOS, ROTULO_EIXO, type ItemRubrica } from "@futsalcollege/core";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const estilos = StyleSheet.create({
  pagina: { padding: 48, fontSize: 11, color: "#16191b" },
  rotulo: { fontSize: 8, letterSpacing: 1.4, color: "#7a7a7a", marginBottom: 4 },
  titulo: { fontSize: 22, marginBottom: 4 },
  subtitulo: { fontSize: 10, color: "#7a7a7a", marginBottom: 18 },
  eixo: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6, color: "#c62f0d" },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dedede",
    gap: 12,
  },
  linhaRotulo: { flexBasis: "40%" },
  linhaNota: { flexBasis: "58%", textAlign: "right" },
  observacoesTitulo: { fontSize: 12, fontWeight: 700, marginTop: 20, marginBottom: 6, color: "#c62f0d" },
  observacoesTexto: { lineHeight: 1.5 },
  rodape: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#7a7a7a",
    borderTopWidth: 0.5,
    borderTopColor: "#dedede",
    paddingTop: 8,
  },
});

export type DadosLaudo = {
  apelido: string;
  categoria: string;
  contexto: string;
  avaliador: string;
  rubricaVersao: string;
  publicadoEm: string;
  itens: ItemRubrica[];
  notas: Record<string, number>;
  texto?: string | null;
};

export function LaudoPDF({ dados }: { dados: DadosLaudo }) {
  const grupos = agruparPorEixo(dados.itens);

  return (
    <Document title={`Avaliação técnica — ${dados.apelido}`}>
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.rotulo}>AVALIAÇÃO TÉCNICA · FUTSAL COLLEGE</Text>
        <Text style={estilos.titulo}>
          {dados.apelido} · {dados.categoria}
        </Text>
        <Text style={estilos.subtitulo}>
          A avaliação compara o atleta com o critério da categoria — nunca com outros atletas.
        </Text>

        {EIXOS.filter((eixo) => grupos[eixo].length > 0).map((eixo) => (
          <View key={eixo}>
            <Text style={estilos.eixo}>{ROTULO_EIXO[eixo]}</Text>
            {grupos[eixo].map((item) => {
              const nota = dados.notas[item.chave];
              return (
                <View key={item.chave} style={estilos.linha}>
                  <Text style={estilos.linhaRotulo}>{item.rotulo}</Text>
                  <Text style={estilos.linhaNota}>
                    {nota ?? "—"} — {nota ? item.ancoras[String(nota) as "1"] : "não avaliado"}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {dados.texto && (
          <View>
            <Text style={estilos.observacoesTitulo}>Observações do avaliador</Text>
            <Text style={estilos.observacoesTexto}>{dados.texto}</Text>
          </View>
        )}

        <Text style={estilos.rodape}>
          Avaliado por {dados.avaliador} · {dados.contexto} · rubrica {dados.rubricaVersao} ·{" "}
          {dados.publicadoEm}
        </Text>
      </Page>
    </Document>
  );
}
