import type { TranslationSchema } from "./index";

export const es: TranslationSchema = {
	overlay: {
		title: "Valoramos su privacidad",
		description:
			"Las cookies opcionales y los servicios externos solo se activan con tu consentimiento. Puedes rechazarlos o cambiar tu elección en cualquier momento. Consulta nuestra",
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
					"Nos ayudan a comprender cómo los visitantes navegan e interactúan con nuestro sitio web, recopilando y reportando datos de uso anónimos. Esto nos permite mejorar el rendimiento del sitio y la experiencia del usuario.",
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
