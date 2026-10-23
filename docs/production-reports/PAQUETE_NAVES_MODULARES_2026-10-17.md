# ENTREGA — NAVES MODULARES · 17/10/2026

Código, diagnóstico, regresiones e informe completo: [NAVES_MODULARES_2026-10-17.md](NAVES_MODULARES_2026-10-17.md).

- Paquete de checkout limpio 2cfb5d4e750d805e0d928a05e02e1b93197d9fa8, dirty:false, revisión c77b06b48514dc2035c67b6011229cf69bd8390d479d0c43109e6a3dff072ec4.
- [ZIP de prueba](evidence/modular-ships/neon-cronium-modular-2cfb5d4.zip): 5459595 bytes. SHA-256: 14915eed3b77db533f897c4d879e41efedb34930dadf9a1a80c18ef54892b073. CRC e inventario completo del ZIP comprobados contra build-info.json.
- Juego alojado: 164040 bytes; SHA-256 cd64ffaa94bff331b94eb00539a03254df1bacde6e690957b4f3a3b50987ed74, idéntico al Chromium final21/21. Build:0; preview15/15:0 sobre el paquete limpio. [Acta JSON](evidence/modular-ships/delivery-attestation.json).
- URL nativa confirmada: **(web privada antigua, retirada)**. Sitio experimental privado del propietario, versión guardada appgprj_6ad34f65ce74819195e871d7dd99fe21~appgver_84691499a4508191a136ab43e3069f96; despliegue appgdep_6ad3576bcce48191942dbd7d86591eff, estado succeeded. Fuente de distribución Git c66c5926ca095166f48bc127a59a4248c00b6616. Sitio existente reutilizado, sin cambiar audiencia.
- Entrar en Campaña clásica → HANGAR. Elegir Astér/Bastión, combinar tres tipos de piezas y APLICAR. La nave antigua permanece en Usar la nave original. Iniciar la campaña normal para probarla; Journey es un prototipo corto conservado, N-7 una variante histórica.
- Las actualizaciones no son automáticas por push: este despliegue se ejecutó y confirmó en esta sesión. La identidad de Sites está en PLAYTEST_SITE.md. El archivo estático se copió y verificó frente a preview-dist; se empujó el estado fuente exacto y se empaquetó manifest+dist, con credenciales efímeras solo en memoria. Se reutilizó el helper alternativo de la entrega previa porque los helpers del plugin no estaban instalados localmente.
- No se repitió una partida remota después de publicar: se confirmó el despliegue nativo y se verificó el paquete local idéntico al navegador. No es certificación de Safari/iPhone, offline o rendimiento prolongado.
- Netlify: sin despliegue nuevo; producción, main, PR #3 y su preview histórica intactos. Motor V1 false.

Para Netlify Drop aislado, si se decide usarlo: extraer ZIP y subir la carpeta cuyo nivel raíz contiene index.html, juego/ y build-info.json. No subirlo al sitio de producción. El paquete no necesita modificar el código ni contratar servicios.

Siguiente lote: jugabilidad del primer nivel clásico con recuperación de CRONIUM, ritmo, cometas y encuentros integrados. No expandir cien etapas ni considerar aprobadas artísticamente estas naves por superar pruebas técnicas.
