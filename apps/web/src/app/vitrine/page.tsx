import { Vitrine, metadataVitrine } from "./Vitrine";

export const revalidate = 60;
export const metadata = metadataVitrine;

export default function PaginaVitrine() {
  return <Vitrine />;
}
