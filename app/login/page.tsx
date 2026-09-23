type Props = {
  searchParams: Promise<{ error?: string; success?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const signup = params.mode === "signup";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <img src="/aeroveritas-logo.png" alt="AeroVeritas" className="auth-logo" />
        <div className="auth-copy">
          <small>AMBIENTE PROFISSIONAL</small>
          <h1>{signup ? "Criar conta" : "Entrar no AeroLex"}</h1>
          <p>
            {signup
              ? "Crie seu acesso para manter casos, teses e citacoes separados por usuario."
              : "Use seu email e senha para acessar o ambiente juridico protegido."}
          </p>
        </div>

        {params.error ? <div className="auth-message auth-error">{params.error}</div> : null}
        {params.success ? <div className="auth-message auth-success">{params.success}</div> : null}

        <form action={signup ? "/api/auth/signup" : "/api/auth/login"} method="post" className="auth-form">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>
          <button type="submit">{signup ? "Criar conta" : "Entrar"}</button>
        </form>

        <a className="auth-switch" href={signup ? "/login" : "/login?mode=signup"}>
          {signup ? "Ja tenho conta" : "Criar uma conta"}
        </a>

        <small className="auth-footnote">
          O acesso protege as rotas do aplicativo. A autorizacao dos dados continua controlada pelo RLS do Supabase.
        </small>
      </section>
    </main>
  );
}
