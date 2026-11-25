import { Cat, Heart } from "lucide-react";

export function MiaupediaLogo() {
  return <div className="logo">
    <span className="logo-mark"><Cat size={20} aria-hidden="true" /><Heart className="community-logo-heart" size={11} aria-hidden="true"/></span>
    <span>Miau<span>pedia</span></span>
  </div>;
}
