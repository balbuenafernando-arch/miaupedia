export const legalDocuments = {
  terminos: {
    title: "Términos y condiciones",
    version: "1.0",
    sections: [
      ["Uso de MIAUPEDIA", "MIAUPEDIA reúne recomendaciones y experiencias de la comunidad sobre el cuidado de gatos, productos y establecimientos. La lectura es pública. Para participar, usa una cuenta habilitada y protege tu sesión."],
      ["Lo que compartes", "Publica experiencias propias y distingue los hechos de tu opinión. Conservas tus derechos y autorizas que MIAUPEDIA aloje y muestre tu aporte para operar la comunidad. Puedes solicitar que se deje de mostrar mediante el canal de la beta."],
      ["Decisiones de compra y cuidado", "Confirma precios, disponibilidad y horarios con el establecimiento. Las publicaciones comunitarias no sustituyen atención veterinaria ni crean una relación comercial con MIAUPEDIA."],
      ["Participación y cambios", "La moderación puede restringir contenido de acuerdo con las normas. Si cambian los documentos obligatorios, pediremos una nueva aceptación antes de que vuelvas a contribuir."],
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    version: "1.0",
    sections: [
      ["Datos y finalidad", "Usamos los datos de acceso que recibe Supabase, el identificador de la cuenta, las aceptaciones y la actividad que decides registrar para autenticarte, guardar tus datos y operar la comunidad. Las fijas y comentarios publicados muestran un seudónimo y su fecha. Los guardados, votos individuales y reportes son de acceso restringido."],
      ["Servicios y acceso", "La aplicación se aloja en Vercel y los datos se gestionan en el proyecto Supabase de MIAUPEDIA. Si eliges Google, Google gestiona la autorización del acceso. Estos servicios pueden procesar datos fuera del Perú. Los operadores autorizados pueden acceder a lo necesario para atender reportes y solicitudes."],
      ["Conservación y derechos", "Puedes solicitar acceso, rectificación, cancelación u oposición mediante el canal directo por el que el administrador te habilitó el acceso a esta beta. Los datos de moderación y aceptaciones se conservan según la finalidad y las obligaciones aplicables. Las solicitudes se revisan conforme a la Ley peruana 29733 y su reglamento."],
      ["Revisión antes de la apertura pública", "Antes del lanzamiento público se debe confirmar la identificación y el contacto del responsable, el canal formal de derechos, los plazos de conservación, las transferencias y el procedimiento de respuesta. Esta versión documenta el funcionamiento de la beta cerrada."],
    ],
  },
  normas: {
    title: "Normas de la comunidad",
    version: "1.0",
    sections: [
      ["Comparte una experiencia útil", "Cuenta qué encontraste, dónde y, si sirve, cuándo o a qué precio. Puedes describir una mala atención con respeto y con hechos que hayas observado."],
      ["Respeta a las personas", "Evita insultos, acoso, publicidad repetida, acusaciones sin sustento y datos personales. No publiques teléfonos privados, correos, contraseñas o historias clínicas."],
      ["Cuida a los gatos", "Evita diagnósticos, dosis y tratamientos como consejos comunitarios. Describe tu experiencia y recomienda consultar a un profesional cuando corresponda."],
    ],
  },
  moderacion: {
    title: "Moderación y reportes",
    version: "1.0",
    sections: [
      ["Cómo reportar", "Elige el motivo que corresponda en una fija, comentario o actualización. Describe el hecho a través del canal de la beta si hace falta contexto adicional."],
      ["Qué revisamos", "La moderación revisa el contenido reportado, el contexto y las normas. Puede mantenerlo u ocultarlo. Una crítica negativa respetuosa puede permanecer publicada. La recepción de reportes no produce un ocultamiento automático."],
      ["Propuestas y revisión", "Una sede propuesta se publica tras revisar su identidad y posibles duplicados. Las decisiones quedan registradas. Puedes solicitar revisión de una decisión mediante el canal por el que se te habilitó esta beta."],
    ],
  },
} as const;

export type LegalDocument = keyof typeof legalDocuments;
export const requiredDocuments = ["terminos", "privacidad", "normas"] as const;
