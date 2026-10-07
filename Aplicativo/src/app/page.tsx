import { redirect } from "next/navigation";

// A raiz leva à Visão geral; o proxy e a página tratam quem não está logado.
export default function Inicio() {
  redirect("/visao-geral");
}
