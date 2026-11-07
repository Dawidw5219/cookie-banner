import type { TranslationSchema } from "./index";

export const es: TranslationSchema = {
	policy: {
		name: "Nombre",
		provider: "Proveedor",
		purpose: "Finalidad",
		retention: "Conservación",
		category: "Categoría",
		functional: "Funcionales",
		security: "Seguridad",
		personalization: "Personalización",
		other: "Otros",
		empty: "Todavía no se han detectado cookies.",
		uncategorized: "No se encontraron cookies clasificadas.",
		functionalDescription: "Comprueba si cada elemento es estrictamente necesario para el servicio solicitado.",
		session: "Sesión",
	},
	content: {
		blocked: "Contenido externo bloqueado",
		external: "Contenido externo",
		videoTitle: "Ver este vídeo de YouTube",
		videoDescription: "La reproducción conecta con YouTube y comparte tu dirección IP y los datos del navegador.",
		description: "Mostrar este contenido comparte tu dirección IP y los datos del navegador con el proveedor.",
		allowPlay: "Aceptar y reproducir",
		allowShow: "Aceptar y mostrar",
		privacyDetails: "Información de privacidad",
		providerPrivacy: "Privacidad del proveedor",
	},
	disclosure: {
		unavailable: "El contenido opcional permanece desactivado hasta completar la información de privacidad. Puedes continuar sin aceptar.",
		retention: "Conservación",
		withdraw: "Retirar todos los consentimientos opcionales",
		saveError: "No se pudo guardar la elección. El tratamiento opcional sigue bloqueado.",
	},
	close: "Cerrar",
	overlay: {
		title: "Valoramos su privacidad",
		description:
			"Las cookies opcionales y los servicios externos solo se activan con tu consentimiento. Puedes rechazarlos o cambiar tu elección en cualquier momento.",
		descriptionPolicyLink: "Para más detalles, consulte nuestra",
		acceptAll: "Aceptar todas",
		advancedSettings: "Configuración avanzada",
		privacyPolicy: "política de privacidad",
		cookiePolicy: "política de cookies",
		andOur: "y nuestra",
	},
	preferences: {
		externalServices: "Servicios externos detectados en este sitio",
		externalServicesDescription: "Consentimiento independiente para cada proveedor. La carga puede compartir tu dirección IP y datos del navegador.",
		title: "Preferencias de cookies",
		description:
			"Gestione sus preferencias de cookies a continuación. Las cookies esenciales están siempre activas ya que son necesarias para el funcionamiento del sitio web. Puede activar o desactivar otras categorías según sus preferencias.",
		descriptionPolicyLink: "Para más detalles, consulte nuestra",
		rejectAll: "Rechazar todas",
		save: "Guardar",
		acceptAllAndContinue: "Aceptar todas y continuar",
		categories: {
			essential: {
				label: "Cookies esenciales",
				description:
					"Estrictamente necesarias para el funcionamiento del sitio web. Estas cookies permiten funciones básicas como la seguridad, la gestión de la red y el acceso a la cuenta. No se pueden desactivar.",
			},
			analytics: {
				label: "Cookies analíticas",
				description:
					"Nos ayudan a comprender cómo los visitantes navegan e interactúan con nuestro sitio web, recopilando y reportando datos de uso. Esto nos permite mejorar el rendimiento del sitio y la experiencia del usuario.",
			},
			marketing: {
				label: "Cookies de marketing",
				description:
					"Se utilizan para mostrar anuncios personalizados relevantes para sus intereses, realizar un seguimiento del rendimiento de las campañas publicitarias y limitar la cantidad de veces que ve un anuncio en particular en diferentes plataformas.",
			},
		},
	},
	floatingIcon: {
		label: "Preferencias de cookies",
	},
};
