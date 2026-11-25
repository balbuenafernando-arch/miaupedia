import Image from "next/image";

export function MiaupediaLogo() {
  return <Image className="miaupedia-wordmark" src="/icons/miaupedia-wordmark.png"
    alt="MIAUPEDIA" width={148} height={47} unoptimized/>;
}

export function MiaupediaMark() {
  return <Image className="miaupedia-medal" src="/icons/miaupedia-medalla.png"
    alt="" width={47} height={50} unoptimized/>;
}
