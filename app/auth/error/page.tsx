import Link from "next/link";

export default function AuthErrorPage() {
  return <main className="page content-width">
    <div className="page-title">
      <h1>No pudimos iniciar sesión con Google</h1>
      <p>Vuelve a iniciar sesión desde el mismo navegador. Si tu cuenta aún no está habilitada, consulta al administrador de Miaupedia.</p>
    </div>
    <Link className="primary" href="/">Volver a Miaupedia</Link>
  </main>;
}
