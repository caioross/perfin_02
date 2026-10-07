import { alternarBloqueioAcao } from "@/app/(portal)/admin/acoes";
import { formatarDataHora } from "@/lib/formatacao";
import type { Papel, PerfilAdmin } from "@/tipos/auth";

const PAPEIS: Record<Papel, string> = {
  admin: "Administrador",
  usuario: "Usuário",
  sem_acesso: "Sem acesso",
  bloqueado: "Bloqueado",
};

type Props = { perfis: PerfilAdmin[] };

export default function TabelaUsuarios({ perfis }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Usuários do Portal</caption>
        <thead className="bg-superficie-2 text-left text-xs text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2">Usuário</th>
            <th scope="col" className="px-3 py-2">Login</th>
            <th scope="col" className="px-3 py-2">Papel</th>
            <th scope="col" className="px-3 py-2">Último acesso</th>
            <th scope="col" className="px-3 py-2"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {perfis.map((p) => {
            const gerenciavel = p.provedor === "google" && (p.papel === "usuario" || p.papel === "bloqueado");
            return (
              <tr key={p.user_id} className="border-t border-borda">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <span className="block font-medium">{p.nome ?? "—"}</span>
                  <span className="text-texto-suave">{p.email}</span>
                </th>
                <td className="px-3 py-2">{p.provedor === "google" ? "Google" : "E-mail e senha"}</td>
                <td className="px-3 py-2">{PAPEIS[p.papel]}</td>
                <td className="numero px-3 py-2">{formatarDataHora(p.ultimo_acesso)}</td>
                <td className="px-3 py-2 text-right">
                  {gerenciavel && (
                    <form action={alternarBloqueioAcao}>
                      <input type="hidden" name="userId" value={p.user_id} />
                      <input type="hidden" name="bloquear" value={p.papel === "usuario" ? "sim" : "nao"} />
                      <button type="submit" className="rounded-lg border border-borda px-3 py-1 hover:bg-superficie-2">
                        {p.papel === "usuario" ? "Bloquear" : "Desbloquear"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
