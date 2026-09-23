type Props = {
  searchParams: Promise<{ error?: string; success?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const signup = params.mode === "signup";

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <img src="/aeroveritas-logo.png" alt="AeroVeritas - Inteligência Jurídica" className="auth-logo" />
        </div>

        <div className="auth-copy">
          <span className="auth-eyebrow">AMBIENTE PROFISSIONAL</span>
          <h1 id="auth-title">{signup ? "Criar sua conta" : "Entrar no AeroLex"}</h1>
          <p>
            {signup
              ? "Crie seu acesso para organizar casos, teses e jurisprudências em um ambiente jurídico protegido."
              : "Acesse seu espaço de trabalho com seu e-mail e senha."}
          </p>
        </div>

        {params.error ? <div className="auth-message auth-error">{params.error}</div> : null}
        {params.success ? <div className="auth-message auth-success">{params.success}</div> : null}

        <form action={signup ? "/api/auth/signup" : "/api/auth/login"} method="post" className="auth-form">
          <label>
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          <button type="submit">{signup ? "Criar conta" : "Entrar"}</button>
        </form>

        <div className="auth-divider"><span>ou</span></div>

        <a className="auth-switch" href={signup ? "/login" : "/login?mode=signup"}>
          {signup ? "Já tenho uma conta" : "Criar uma conta"}
        </a>

        <div className="auth-security">
          <span aria-hidden="true">✓</span>
          <p>
            Sessão protegida pelo Supabase Auth. O acesso aos dados continua submetido às políticas de RLS.
          </p>
        </div>
      </section>
    </main>
  );
}
