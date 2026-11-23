# Spanish (español) content. Uses "usted". Have a bilingual compliance reviewer approve the consent wording before launch.
from content import SITE, YEARLY
# Set to False if no one on your team speaks Spanish. The Spanish site still works; it just won't promise Spanish-language service.
SPANISH_SPEAKING_TEAM = True
yr = YEARLY["year"]

SITE_ES = {
  "states_line": "Con licencia en [indique sus estados].",
  "hours": "Lunes a viernes, 8am a 8pm ET · Sábados, 9am a 2pm ET",
}
PRODUCT_ES = {"health": ("Seguro médico individual y familiar", "Cobertura médica para usted, su cónyuge y sus hijos."),
              "business": ("Cobertura para negocios y empleados", "Cobertura médica para usted y su equipo."),
              "dental": ("Dental y visión", "Planes dentales y de visión."), "supplemental": ("Cobertura complementaria", "Planes de accidentes, enfermedades graves y hospital.")}

HOME_FAQ_ES = [
 ("¿Qué es Mr. Marketplace?", "Mr. Marketplace es la forma más fácil de comparar seguros médicos y conectar con un profesional con licencia. Usted nos cuenta sobre su hogar, ve planes y precios reales del Mercado de todas las aseguradoras de su área, y un profesional con licencia le ayuda a elegir."),
 ("¿Los precios son reales?", "Sí. Para la cobertura individual y familiar en la mayoría de los estados, los precios provienen de los mismos datos federales del Mercado que usa CuidadoDeSalud.gov, según las edades, el código postal y el ingreso que usted ingrese. Las primas finales se confirman al inscribirse."),
 ("¿Tiene algún costo?", "No. Los agentes con licencia reciben su pago de la aseguradora. Para el mismo plan, su prima es la misma si se inscribe por su cuenta o con un agente con licencia."),
 ("¿Venderán mi información?", "No. Su solicitud va a un solo profesional con licencia y nunca se vende ni se comparte con otros agentes o compradores de contactos. Usted elige cómo prefiere que le contactemos."),
 ("¿Esto es CuidadoDeSalud.gov?", "No. Mr. Marketplace no es un sitio del gobierno ni una aseguradora. CuidadoDeSalud.gov muestra todos los planes del Mercado en su área."),
 ("¿Ayudan con Medicare?", "Por ahora no. Nuestra plataforma es para personas, familias y dueños de negocio menores de 65 años. Si tiene 65 años o más, es.medicare.gov es el mejor lugar para comparar sus opciones."),
]

HOME_ES = {
 "eyebrow":"Seguro médico, claro y sencillo","h1":"Su cobertura. Sus prioridades. Sus decisiones.",
 "lead":"Vea planes y precios reales de todas las aseguradoras de su área y reciba ayuda de un profesional con licencia.",
 "cta":"Comenzar mi revisión","how":"Cómo funciona",
 "ticks":["Planes y precios reales","Todas las aseguradoras","Profesionales con licencia","Nunca vendemos su información"],
 "loading":"Cargando… Si no carga,","carriers":"Planes disponibles<br>a través de","more":"y todas las demás aseguradoras del Mercado en su área",
 "how_kick":"Cómo funciona","how_h":"El seguro médico debería ser fácil de entender.","how_p":"Tres pasos desde \"necesito cobertura\" hasta una respuesta clara.",
 "steps":[("Cuéntenos sobre usted","Su estado, su hogar y cómo contactarle. Toma menos de un minuto."),("Personalice su revisión","Unas preguntas más y luego planes y precios mensuales reales de todas las aseguradoras de su área."),("Hable con un profesional con licencia","Un profesional con licencia le llama o le escribe para ayudarle a elegir e inscribirse. Siga su solicitud en línea en cualquier momento.")],
 "tools_kick":"Herramientas","tools_h":"Todo lo que necesita para elegir con confianza.","tools_p":"Las preguntas que más preocupan, respondidas antes de inscribirse.","tools_cta":"Comenzar a comparar",
 "solve":[("dr","“¿Mi médico está cubierto?”","Revisión de médicos y hospitales","Busque a sus médicos, especialistas y hospitales y vea qué planes los incluyen en su red, según los datos que las aseguradoras reportan a CuidadoDeSalud.gov."),
   ("rx","“¿Cubrirán mi medicamento?”","Revisión de medicamentos","Agregue sus medicamentos y vea qué planes los cubren, con la lista de medicamentos de cada plan a un clic."),
   ("cost","“¿Cuánto pagaré de verdad?”","Costo anual real","Primas, deducibles y límites de gastos de bolsillo combinados en un solo costo anual estimado para uso bajo, medio o alto."),
   ("cols","“¿Qué plan es mejor?”","Comparación lado a lado","Compare hasta tres planes: costos, copagos, tipo de red, calificación de calidad y sus médicos."),
   ("book","“¿Qué significa ese término?”","Explicaciones sencillas","Toque cualquier término para ver una definición clara, desde coseguro hasta máximo de gastos de bolsillo."),
   ("coin","“¿Califico para ahorros?”","Crédito fiscal estimado","Su crédito fiscal estimado se aplica automáticamente a cada precio, con una explicación sencilla de cómo funciona."),
   ("people","“Quiero que alguien me lo explique.”","Un profesional con licencia","Un especialista con licencia revisa sus opciones con usted, verifica redes y medicamentos y le ayuda a inscribirse."),
   ("track","“¿Qué sigue?”","Siga su solicitud","Vea cada paso en línea, envíe mensajes a su especialista y controle cómo le contactamos.")],
 "free_kick":"Calculadoras gratuitas","free_h":"Respuestas en segundos, sin dar sus datos.",
 "fc":[("Su médico","En la red","ok"),("Crédito fiscal aplicado","\u2212$412/mes","credit"),("Comparados lado a lado","3 planes Oro","cmp")],"example":"Ejemplo",
 "stats":[("14","+","aseguradoras"),("5","","calculadoras gratuitas"),("2"," min","para ver sus tarifas"),("0","$","de costo para usted")],
 "demo_kick":"Véalo en acción","demo_h":"Toda su búsqueda, en un solo lugar.","demo_p":"Sin centros de llamadas ni adivinanzas. Vea cómo funciona.",
 "demo_steps":[("Planes reales, precios reales","Todos los planes del Mercado en su código postal, con su crédito fiscal ya aplicado."),("Sus médicos, revisados","Vea qué planes incluyen a sus médicos y medicamentos antes de elegir."),("El mejor valor, primero","Ordene por lo que realmente pagaría en un año, no solo por la prima mensual.")],
 "demo_rows":[("Florida Blue","Oro PPO","$612","$7,344"),("Ambetter","Plata HMO","$488","$9,120"),("Oscar","Oro EPO","$574","$6,890"),("Aetna CVS Health","Bronce HMO","$341","$11,250")],
 "demo_lbl":["Mensual","Anual est.","En la red","Mejor valor","Ordenado por costo anual"],
 "why_kick":"Por qué Mr. Marketplace","why_h":"Diseñado como una plataforma financiera. Atendido por personas.",
 "feats":[("compass","Explore opciones","Una experiencia guiada con planes y precios reales donde estén disponibles."),("people","Asistencia personal","Un profesional con licencia se encarga de todo, desde su primera pregunta hasta la inscripción."),("shield","Experiencia segura","Cifrado, nunca vendido, y contacto solo de las formas que usted elija."),("health","Todas las aseguradoras, lado a lado","Todos los planes del Mercado en su área, de todas las aseguradoras, con precios mensuales reales.")],
 "shop_kick":"Cobertura","shop_h":"¿Qué está buscando?","shop_go":"Explorar opciones",
 "diff_kick":"La diferencia","diff_h":"Los mismos planes. Las mismas primas. Alguien de su lado.",
 "left_h":"Comprando por su cuenta","left_s":"CuidadoDeSalud.gov o un mercado estatal","right_s":"Sin costo adicional",
 "left":["Decenas de planes para comparar solo","Revisar cada médico y medicamento a mano","Los impuestos quedan por su cuenta","Nadie revisa su plan al renovar"],
 "right":["Precios reales, filtrados según lo que le conviene","Médicos y medicamentos revisados por usted","Deducciones para independientes y HSA consideradas","El mismo profesional en cada renovación"],
 "diff_fine":"Los agentes con licencia reciben su pago de la aseguradora. Para el mismo plan, su prima es la misma si se inscribe por su cuenta o con un agente con licencia. CuidadoDeSalud.gov muestra todos los planes del Mercado en su área.",
 "faq_kick":"Preguntas","faq_h":"Bueno saberlo antes de empezar.","faq_p":"¿Prefiere hablar?","faq_p2":", o pregunte a nuestro asistente en la esquina.",
 "cta_h":"Su cobertura. Sus decisiones.","cta_p":"Comience hoy su revisión personalizada de cobertura. Toma unos dos minutos.","cta_or":"o",
 "title":"Mr. Marketplace | Compare todos los planes de salud del Mercado en un solo lugar","desc":"Su mercado de seguros médicos, más claro. Compare planes y precios reales de todas las aseguradoras de su área, revise sus médicos y medicamentos y reciba ayuda gratis.",
}

GLOSSARY_ES = [
 ("Prima","La cantidad que paga cada mes para mantener su plan activo, use o no atención médica."),
 ("Deducible","Lo que paga cada año por servicios cubiertos antes de que su plan comience a compartir los costos. Muchos planes cubren la atención preventiva, y a veces consultas y medicamentos genéricos, antes del deducible."),
 ("Máximo de gastos de bolsillo","Lo máximo que pagará en un año por atención cubierta dentro de la red. Incluye el deducible, los copagos y el coseguro, pero no las primas. Al alcanzarlo, el plan paga el 100% de la atención cubierta dentro de la red por el resto del año."),
 ("Copago","Una cantidad fija que paga por un servicio cubierto, como $30 por una consulta de atención primaria."),
 ("Coseguro","Su parte del costo de un servicio cubierto como porcentaje, como el 20%. Generalmente aplica después de alcanzar el deducible."),
 ("Niveles de metal","Los planes del Mercado se agrupan en Bronce, Plata, Oro y Platino según cómo usted y el plan dividen los costos. Bronce tiene las primas más bajas y los costos más altos al recibir atención; Platino es lo contrario. El nivel indica la división de costos, no la calidad de la atención."),
 ("Bronce ampliado","Un plan Bronce que cubre al menos un servicio importante, como algunas consultas, antes del deducible."),
 ("Plan catastrófico","Un plan de prima baja y deducible muy alto disponible para menores de 30 años o personas con una exención por dificultades. Cubre atención preventiva y algunas consultas antes del deducible."),
 ("Red","Los médicos, hospitales, farmacias y otros proveedores con los que un plan tiene contrato. Usar proveedores de la red cuesta mucho menos, y algunos planes no cubren atención fuera de la red excepto en emergencias."),
 ("HMO","Organización para el Mantenimiento de la Salud. Generalmente cubre solo atención de proveedores de la red (excepto emergencias) y a menudo requiere un referido de su médico de cabecera para ver a un especialista."),
 ("PPO","Organización de Proveedores Preferidos. Cubre la atención dentro de la red al menor costo y también paga parte del costo de proveedores fuera de la red, generalmente sin referidos."),
 ("EPO","Organización de Proveedores Exclusivos. Cubre solo atención dentro de la red (excepto emergencias), generalmente sin requerir referidos."),
 ("POS","Punto de Servicio. Combina características de HMO y PPO: normalmente necesita referidos, pero se cubre parte de la atención fuera de la red."),
 ("Formulario de medicamentos","La lista de medicamentos recetados que cubre un plan, generalmente agrupados en niveles que determinan lo que usted paga."),
 ("Autorización previa","La aprobación que su plan exige antes de cubrir ciertos servicios o medicamentos."),
 ("HSA (Cuenta de Ahorros para la Salud)","Una cuenta con ventajas fiscales que puede abrir con un plan compatible con HSA. El dinero entra antes de impuestos, crece libre de impuestos y sale libre de impuestos para gastos médicos calificados."),
 ("Crédito fiscal para la prima","Un crédito fiscal que reduce su prima mensual de un plan del Mercado. El monto depende de su ingreso familiar esperado para el año de cobertura, el tamaño de su hogar y el costo de un plan Plata de referencia en su área. Se concilia en su declaración federal de impuestos."),
 ("Reducciones de costos compartidos","Ahorros adicionales que reducen deducibles, copagos y máximos de gastos de bolsillo para hogares de menores ingresos que califican. Solo están disponibles en planes Plata."),
 ("Plan de referencia","El segundo plan Plata de menor costo en su área. Se usa para calcular el monto de su crédito fiscal."),
 ("Ingreso bruto ajustado modificado (MAGI)","La cifra de ingreso que usa el Mercado para determinar los créditos fiscales. Para la mayoría de las personas se parece al ingreso bruto ajustado de su declaración de impuestos, con algunos conceptos añadidos."),
 ("Inscripción Abierta","El período anual en que cualquier persona puede inscribirse o cambiar de plan del Mercado. Fuera de él, necesita un evento de vida que califique."),
 ("Período de Inscripción Especial","Un plazo fuera de la Inscripción Abierta para obtener cobertura después de un evento de vida que califique, como perder otra cobertura, mudarse, casarse o tener un bebé."),
 ("Resumen de Beneficios y Cobertura (SBC)","Un documento estandarizado que todo plan debe ofrecer y que explica costos y cobertura en un formato uniforme, para facilitar la comparación."),
 ("Agente de seguros con licencia","Un profesional con licencia de su estado para vender y explicar seguros. Los agentes que ayudan con la inscripción en el Mercado también deben estar registrados con el Mercado."),
]

HELP_ES = [
 ("Comprar y comparar", [
  ("¿Cómo comparo planes?", "Después de ver sus tarifas, marque hasta tres planes y seleccione Comparar lado a lado. Verá primas, deducibles, máximos de gastos de bolsillo, copagos, tipo de red y un costo anual estimado uno al lado del otro."),
  ("¿Qué significa el costo anual estimado?", "Suma 12 meses de prima a un estimado de lo que pagaría por atención. Elija uso bajo, medio o alto. Es una guía para comparar planes, no una cotización."),
  ("¿Qué nivel de metal me conviene?", "Si casi no usa atención médica, la prima baja de un plan Bronce puede costar menos en el año. Si va al médico a menudo, toma medicamentos o espera un procedimiento, Oro o Plata suelen costar menos en total."),
  ("¿Estos son todos los planes disponibles?", "Mostramos los planes del Mercado reportados para su código postal en CuidadoDeSalud.gov. En los estados con mercado propio, no hay precios en vivo aquí y su especialista revisa las opciones con usted directamente."),
 ]),
 ("Médicos y medicamentos", [
  ("¿Cómo reviso si mi médico está en la red?", "En sus resultados, busque a su médico u hospital en Sus médicos y hospitales. Cada plan mostrará si ese proveedor aparece en la red."),
  ("¿Por qué un plan dice 'sin información'?", "La aseguradora no reportó ese proveedor o medicamento para ese plan a CuidadoDeSalud.gov. No significa que no esté cubierto. Su especialista puede verificarlo."),
  ("¿Puedo confiar en los resultados de la red?", "Provienen de los datos que las aseguradoras reportan a CuidadoDeSalud.gov, pero las redes cambian. Antes de inscribirse, confírmelo con el consultorio y el plan. Su especialista puede hacerlo por usted."),
 ]),
 ("Costos, ingresos y créditos fiscales", [
  ("¿Qué ingreso debo ingresar?", "Su mejor estimado del ingreso de su hogar para el año de cobertura. Si trabaja por cuenta propia, generalmente es su ingreso neto del negocio después de gastos."),
  ("¿Por qué no veo un crédito fiscal?", f"Según el ingreso y el hogar que ingresó, podría no calificar. Para {yr}, no hay crédito fiscal cuando el ingreso supera el 400% del nivel federal de pobreza. Pruebe nuestra calculadora de crédito fiscal."),
  ("¿Qué pasa si mi ingreso cambia?", "Los créditos fiscales se concilian en su declaración de impuestos. Si su ingreso cambia durante el año, actualice su solicitud del Mercado."),
 ]),
 ("Su especialista", [
  ("¿Qué hace mi especialista?", "Un profesional de seguros con licencia responde sus preguntas, verifica médicos y medicamentos, explica los costos, le ayuda a inscribirse y le contacta antes de la renovación."),
  ("¿Cuesta más usar un agente?", "No. Para el mismo plan, su prima es la misma si se inscribe por su cuenta o con un agente con licencia. Los agentes reciben su pago de la aseguradora."),
  ("¿Puedo inscribirme por mi cuenta?", "Sí. Siempre puede inscribirse directamente en CuidadoDeSalud.gov o en el mercado oficial de su estado."),
 ]),
]

if SPANISH_SPEAKING_TEAM:
    HOME_FAQ_ES.insert(5, ("¿Me atenderán en español?", "Sí. Al comenzar su revisión en esta página, su especialista sabrá que prefiere español."))
    HELP_ES[3][1].insert(2, ("¿Me atenderán en español?", "Sí. Al comenzar en la versión en español, su especialista sabrá que prefiere español."))
