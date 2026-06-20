import type { Metadata } from "next";
import { MiaupediaApp } from "@/components/miaupedia-app";
export async function generateMetadata({params}:{params:Promise<{district:string}>}):Promise<Metadata>{const {district}=await params;return{title:`Veterinarias para gatos en ${district} | Miaupedia`,description:`Descubre veterinarias valoradas por dueños de gatos en ${district}, Perú.`}}
export default function DistrictPage(){return <MiaupediaApp/>}
