# Beta Android de Miaupedia

El módulo Android abre la PWA existente en `https://miaupedia.vercel.app` mediante Trusted Web Activity. Usa el paquete `pe.balbuenalabs.miaupedia`, Android 16 (API 36), Android Browser Helper y el navegador compatible del dispositivo.

## Compilar el AAB

Instala JDK 17 y el SDK de Android con `platforms;android-36`, Platform Tools y Build Tools. Configura `ANDROID_HOME` y la ruta absoluta al almacén PKCS#12 en `MIAUPEDIA_ANDROID_KEYSTORE`. Define `MIAUPEDIA_ANDROID_KEY_ALIAS` y carga `MIAUPEDIA_ANDROID_STORE_PASSWORD` de un almacén privado. Si el almacén y la clave usan contraseñas distintas, define también `MIAUPEDIA_ANDROID_KEY_PASSWORD`. En la estación que preparó la beta, la contraseña está en el llavero de macOS bajo **Miaupedia Android Upload Key**.

Desde la raíz del repositorio:

```bash
android/gradlew -p android --no-daemon :app:bundleRelease :app:lintRelease
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
java -jar /ruta/a/bundletool.jar validate --bundle=android/app/build/outputs/bundle/release/app-release.aab
```

Usa la clave de carga de Miaupedia para las actualizaciones. El almacén privado queda fuera del repositorio. El AAB se carga en Play Console. Para comprobar la instalación local, genera los APK con bundletool y fírmalo con la clave correspondiente a esa prueba.

## Asociación con el sitio

El manifiesto Android contiene el origen de Miaupedia. [La declaración del sitio](../app/.well-known/assetlinks.json/statement.json) contiene la huella pública del certificado de carga usado para el AAB de esta fase y para los APK de validación local.

Cuando Balbuena Labs confirme el identificador en Play Console y active Play App Signing, toma la huella SHA-256 de **App signing key certificate** en **Integridad de la aplicación**. Añádela a la declaración y publica el archivo en Vercel. Conserva la huella de carga solo si habrá APK de pruebas firmados localmente. Comprueba que `https://miaupedia.vercel.app/.well-known/assetlinks.json` responde HTTP 200, con JSON y sin redirecciones. Usa la huella de Google Play al verificar un APK instalado desde la pista de pruebas.

## Acceso para testers

El registro público y la recuperación por correo siguen restringidos. Un administrador de MIAUPEDIA puede crear y confirmar cada cuenta en Supabase Auth y compartir las credenciales iniciales de forma privada. La invitación a una pista de Google Play y el acceso a MIAUPEDIA se administran por separado. OAuth queda fuera de esta fase.

En un Android físico, instala desde la pista de pruebas cuando esté habilitada. Comprueba el arranque a pantalla completa, los enlaces del sitio, el ingreso, la recarga, el cierre de sesión, «Mis gatos», «Agenda» y una reseña con un producto real disponible. Una respuesta 401 de Supabase sin sesión es esperada. Si aparece tras iniciar sesión, vuelve a probar el acceso en el dispositivo y registra en qué petición ocurrió sin guardar contraseñas, tokens ni cookies.
