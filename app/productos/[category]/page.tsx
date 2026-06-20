import type { Metadata } from "next";
import { MiaupediaApp } from "@/components/miaupedia-app";
export async function generateMetadata({params}:{params:Promise<{category:string}>}):Promise<Metadata>{const {category}=await params;return{title:`Productos para gatos: ${category} | Miaupedia`,description:`Compara ${category} para gatos según experiencias de la comunidad peruana.`}}
export default function ProductCategoryPage(){return <MiaupediaApp/>}
