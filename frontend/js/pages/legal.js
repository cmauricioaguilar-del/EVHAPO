// ─── MindEV-IA · Legal (Privacidad + Términos de Uso) ────────────────────────
// Cubre: Ley 19.628 (Chile) · LGPD (Brasil) · UK/EU GDPR · PIPEDA (Canadá)
// Empresa: Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.
// RUT: 78.420.655-6 · Chile

// ─── Contenido por idioma ────────────────────────────────────────────────────

const LEGAL = {

  // ══════════════════════════════════════════════════════════════════════════
  //  POLÍTICA DE PRIVACIDAD
  // ══════════════════════════════════════════════════════════════════════════
  privacy: {

    // ── Español ──────────────────────────────────────────────────────────────
    es: {
      title: 'Política de Privacidad',
      updated: '22 de mayo de 2026',
      tldr: {
        heading: '📋 Resumen rápido (TL;DR)',
        items: [
          '✅ Guardamos: nombre, email, país, sala de póker y tus respuestas al test.',
          '🎯 Solo usamos esos datos para generar tu diagnóstico personalizado con IA.',
          '🚫 Nunca vendemos tus datos ni los usamos para publicidad dirigida.',
          '📊 Solo hacemos análisis estadísticos generales, anónimos y agregados.',
          '🤝 Terceros que procesan datos: OpenAI (perfil IA), Stripe/MercadoPago (pagos), Railway (servidores).',
          '🔑 Puedes acceder, corregir o eliminar tus datos cuando quieras.',
          '📧 Contacto: c.mauricio.aguilar@gmail.com',
        ],
      },
      sections: [
        {
          title: '1. Responsable del tratamiento',
          body: `<b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br>RUT: 78.420.655-6 · Chile<br>Plataforma: MindEV-IA (mindev-ia.cl)<br>Contacto: <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>`,
        },
        {
          title: '2. Datos que recopilamos',
          body: `<b>Datos de registro:</b> nombre, apellido, correo electrónico, país de residencia, sala de póker preferida.<br><br>
<b>Datos del test:</b> tus respuestas a las preguntas del diagnóstico mental y técnico (94 preguntas).<br><br>
<b>Datos de acceso:</b> dirección IP, tipo de dispositivo y fecha/hora de conexión (solo para seguridad).<br><br>
<b>Datos de pago:</b> gestionados íntegramente por Stripe o MercadoPago. MindEV-IA <u>no almacena</u> números de tarjeta ni datos bancarios.`,
        },
        {
          title: '3. Para qué usamos tus datos',
          body: `• Generar tu diagnóstico mental y técnico personalizado con inteligencia artificial.<br>
• Enviarte tu contraseña temporal si olvidas la clave.<br>
• Mejorar el servicio mediante estadísticas agregadas y anónimas (nunca análisis individuales).<br>
• Informarte de actualizaciones importantes del servicio (sin spam ni publicidad de terceros).`,
        },
        {
          title: '4. Base legal del tratamiento',
          body: `El tratamiento se basa en tu <b>consentimiento explícito</b>, otorgado al aceptar esta política durante el registro.<br><br>
<b>Usuarios en Brasil (LGPD):</b> base legal: consentimiento (art. 7°, inciso I, Lei 13.709/2018). Encarregado pelo tratamento de dados: Claudio Mauricio Aguilar Figueroa — c.mauricio.aguilar@gmail.com.`,
        },
        {
          title: '5. Terceros que acceden a tus datos',
          body: `<b>OpenAI (EE.UU.):</b> recibe tus respuestas del test para generar el perfil de IA. Sujeto a la <a href="https://openai.com/privacy" target="_blank" style="color:var(--accent)">política de OpenAI</a>.<br><br>
<b>Stripe (EE.UU.) / MercadoPago (Argentina):</b> procesan los pagos. Solo confirman si el pago fue exitoso; no comparten datos financieros con MindEV-IA.<br><br>
<b>Railway (EE.UU.):</b> proveedor de hosting y base de datos.<br><br>
No compartimos tus datos con ningún otro tercero ni los vendemos bajo ninguna circunstancia.`,
        },
        {
          title: '6. Retención de datos',
          body: `Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, eliminaremos tus datos personales en un plazo máximo de <b>30 días</b>, salvo que debamos conservarlos por obligación legal.`,
        },
        {
          title: '7. Tus derechos',
          body: `Tienes derecho a:<br>
• <b>Acceder</b> a los datos que tenemos sobre ti.<br>
• <b>Corregir</b> datos incorrectos o desactualizados.<br>
• <b>Eliminar</b> tu cuenta y todos tus datos.<br>
• <b>Portabilidad:</b> recibir tus datos en formato descargable.<br>
• <b>Retirar tu consentimiento</b> en cualquier momento.<br><br>
Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>. Respondemos en un máximo de 15 días hábiles.`,
        },
        {
          title: '8. Seguridad',
          body: `Utilizamos conexión cifrada <b>HTTPS/TLS</b>, contraseñas almacenadas con hash seguro (bcrypt) y acceso restringido a la base de datos. Ningún sistema es 100% infalible, pero hacemos todo lo razonablemente posible para proteger tu información.`,
        },
        {
          title: '9. Menores de edad',
          body: `MindEV-IA está dirigida a personas de <b>18 años o más</b>. No recopilamos datos de menores de forma intencional. Si detectas que un menor se ha registrado, contáctanos para eliminarlo.`,
        },
        {
          title: '10. Cambios en esta política',
          body: `Si realizamos cambios significativos, te lo notificaremos dentro de la app y te pediremos que aceptes la nueva versión.`,
        },
      ],
    },

    // ── English ──────────────────────────────────────────────────────────────
    en: {
      title: 'Privacy Policy',
      updated: 'May 22, 2026',
      tldr: {
        heading: '📋 Quick Summary (TL;DR)',
        items: [
          '✅ We store: name, email, country, preferred poker room, and your test answers.',
          '🎯 We only use that data to generate your personalized AI diagnostic.',
          '🚫 We never sell your data or use it for individual advertising.',
          '📊 We only run general, anonymous, aggregated statistical analysis.',
          '🤝 Third parties that process data: OpenAI (AI profile), Stripe/MercadoPago (payments), Railway (servers).',
          '🔑 You can access, correct, or delete your data at any time.',
          '📧 Contact: c.mauricio.aguilar@gmail.com',
        ],
      },
      sections: [
        {
          title: '1. Data Controller',
          body: `<b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br>Tax ID (RUT): 78.420.655-6 · Chile<br>Platform: MindEV-IA (mindev-ia.cl)<br>Contact: <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>`,
        },
        {
          title: '2. Data We Collect',
          body: `<b>Registration data:</b> first name, last name, email address, country of residence, preferred poker room.<br><br>
<b>Test data:</b> your answers to the mental and technical diagnostic questions (94 questions).<br><br>
<b>Access logs:</b> IP address, device type, and connection timestamp (for security purposes only).<br><br>
<b>Payment data:</b> handled entirely by Stripe or MercadoPago. MindEV-IA <u>does not store</u> card numbers or bank details.`,
        },
        {
          title: '3. How We Use Your Data',
          body: `• Generate your personalized mental and technical diagnostic using artificial intelligence.<br>
• Send you a temporary password if you forget your credentials.<br>
• Improve the service through anonymous, aggregated statistics (no individual analysis).<br>
• Notify you of important service updates (no spam or third-party advertising).`,
        },
        {
          title: '4. Legal Basis for Processing',
          body: `Processing is based on your <b>explicit consent</b>, given when you accept this policy during registration.<br><br>
<b>Users in the UK/EU:</b> legal basis under UK GDPR / EU GDPR: consent (Art. 6(1)(a)).<br>
<b>Users in Brazil (LGPD):</b> legal basis: consent (Art. 7°, item I, Lei 13.709/2018). Data Protection Officer: Claudio Mauricio Aguilar Figueroa — c.mauricio.aguilar@gmail.com.`,
        },
        {
          title: '5. Third Parties That Access Your Data',
          body: `<b>OpenAI (USA):</b> receives your test answers to generate the AI profile. Subject to <a href="https://openai.com/privacy" target="_blank" style="color:var(--accent)">OpenAI's privacy policy</a>.<br><br>
<b>Stripe (USA) / MercadoPago (Argentina):</b> process payments. They only confirm whether payment succeeded; they do not share financial data with MindEV-IA.<br><br>
<b>Railway (USA):</b> hosting and database provider.<br><br>
We do not share your data with any other third party, and we never sell it.`,
        },
        {
          title: '6. Data Retention',
          body: `We keep your data while your account is active. If you request account deletion, we will erase your personal data within <b>30 days</b>, unless we are legally required to retain it.`,
        },
        {
          title: '7. Your Rights',
          body: `You have the right to:<br>
• <b>Access</b> the data we hold about you.<br>
• <b>Correct</b> inaccurate or outdated data.<br>
• <b>Delete</b> your account and all associated data.<br>
• <b>Data portability:</b> receive your data in a downloadable format.<br>
• <b>Withdraw consent</b> at any time.<br><br>
To exercise any of these rights, contact us at <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>. We respond within 15 business days.`,
        },
        {
          title: '8. Security',
          body: `We use <b>HTTPS/TLS</b> encryption, passwords stored with bcrypt hashing, and restricted database access. No system is 100% immune, but we take every reasonable measure to protect your information.`,
        },
        {
          title: '9. Minors',
          body: `MindEV-IA is intended for users aged <b>18 and over</b>. We do not knowingly collect data from minors. If you believe a minor has registered, please contact us for removal.`,
        },
        {
          title: '10. Changes to This Policy',
          body: `If we make significant changes, we will notify you in-app and ask you to accept the updated version.`,
        },
      ],
    },

    // ── Português ─────────────────────────────────────────────────────────────
    pt: {
      title: 'Política de Privacidade',
      updated: '22 de maio de 2026',
      tldr: {
        heading: '📋 Resumo Rápido (TL;DR)',
        items: [
          '✅ Armazenamos: nome, e-mail, país, sala de poker favorita e suas respostas ao teste.',
          '🎯 Usamos esses dados apenas para gerar seu diagnóstico personalizado com IA.',
          '🚫 Jamais vendemos seus dados ou os usamos para publicidade individual.',
          '📊 Realizamos apenas análises estatísticas gerais, anônimas e agregadas.',
          '🤝 Terceiros que processam dados: OpenAI (perfil IA), Stripe/MercadoPago (pagamentos), Railway (servidores).',
          '🔑 Você pode acessar, corrigir ou excluir seus dados a qualquer momento.',
          '📧 Contato: c.mauricio.aguilar@gmail.com',
        ],
      },
      sections: [
        {
          title: '1. Responsável pelo Tratamento',
          body: `<b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br>RUT: 78.420.655-6 · Chile<br>Plataforma: MindEV-IA (mindev-ia.cl)<br>Contato: <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a><br><br>
<b>Encarregado pelo Tratamento de Dados (LGPD):</b> Claudio Mauricio Aguilar Figueroa<br>E-mail: <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>`,
        },
        {
          title: '2. Dados que Coletamos',
          body: `<b>Dados de cadastro:</b> nome, sobrenome, e-mail, país de residência, sala de poker preferida.<br><br>
<b>Dados do teste:</b> suas respostas às perguntas do diagnóstico mental e técnico (94 perguntas).<br><br>
<b>Logs de acesso:</b> endereço IP, tipo de dispositivo e data/hora de conexão (apenas para segurança).<br><br>
<b>Dados de pagamento:</b> gerenciados integralmente pela Stripe ou MercadoPago. O MindEV-IA <u>não armazena</u> números de cartão nem dados bancários.`,
        },
        {
          title: '3. Finalidade do Tratamento',
          body: `• Gerar seu diagnóstico mental e técnico personalizado com inteligência artificial.<br>
• Enviar sua senha temporária em caso de recuperação de acesso.<br>
• Melhorar o serviço por meio de estatísticas anônimas e agregadas (nunca análises individuais).<br>
• Informar sobre atualizações importantes do serviço (sem spam ou publicidade de terceiros).`,
        },
        {
          title: '4. Base Legal do Tratamento (LGPD)',
          body: `O tratamento de seus dados se baseia no seu <b>consentimento explícito</b> (art. 7°, inciso I, Lei 13.709/2018 — LGPD), fornecido ao aceitar esta política durante o cadastro.<br><br>
Você pode revogar seu consentimento a qualquer momento entrando em contato conosco. A revogação não afeta o tratamento realizado anteriormente.`,
        },
        {
          title: '5. Terceiros que Acessam seus Dados',
          body: `<b>OpenAI (EUA):</b> recebe suas respostas do teste para gerar o perfil de IA. Sujeito à <a href="https://openai.com/privacy" target="_blank" style="color:var(--accent)">política de privacidade da OpenAI</a>.<br><br>
<b>Stripe (EUA) / MercadoPago (Argentina):</b> processam pagamentos. Apenas confirmam se o pagamento foi realizado com sucesso; não compartilham dados financeiros com o MindEV-IA.<br><br>
<b>Railway (EUA):</b> provedor de hospedagem e banco de dados.<br><br>
Não compartilhamos seus dados com nenhum outro terceiro e <b>jamais os vendemos</b>.`,
        },
        {
          title: '6. Retenção de Dados',
          body: `Conservamos seus dados enquanto sua conta estiver ativa. Se você solicitar a exclusão da conta, removeremos seus dados pessoais em até <b>30 dias</b>, salvo obrigação legal de retenção.`,
        },
        {
          title: '7. Seus Direitos (LGPD, Art. 18)',
          body: `Você tem direito a:<br>
• <b>Confirmar</b> a existência do tratamento de seus dados.<br>
• <b>Acessar</b> os dados que temos sobre você.<br>
• <b>Corrigir</b> dados incompletos, inexatos ou desatualizados.<br>
• <b>Anonimização, bloqueio ou eliminação</b> de dados desnecessários.<br>
• <b>Portabilidade</b> dos dados a outro fornecedor de serviço.<br>
• <b>Eliminação</b> dos dados tratados com base no consentimento.<br>
• <b>Revogar o consentimento</b> a qualquer momento.<br><br>
Para exercer esses direitos, escreva para <a href="mailto:c.mauricio.aguilar@gmail.com" style="color:var(--accent)">c.mauricio.aguilar@gmail.com</a>. Respondemos em até 15 dias úteis.`,
        },
        {
          title: '8. Segurança',
          body: `Utilizamos conexão criptografada <b>HTTPS/TLS</b>, senhas armazenadas com hash seguro (bcrypt) e acesso restrito ao banco de dados. Em caso de incidente de segurança que possa causar risco ou dano, notificaremos a ANPD e os titulares afetados no prazo legal.`,
        },
        {
          title: '9. Menores de Idade',
          body: `O MindEV-IA é destinado a pessoas com <b>18 anos ou mais</b>. Não coletamos dados de menores intencionalmente. Se você identificar um menor cadastrado, entre em contato para exclusão.`,
        },
        {
          title: '10. Alterações nesta Política',
          body: `Caso realizemos alterações significativas, notificaremos você dentro do aplicativo e solicitaremos a aceitação da nova versão.`,
        },
      ],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  TÉRMINOS DE USO
  // ══════════════════════════════════════════════════════════════════════════
  terms: {

    // ── Español ──────────────────────────────────────────────────────────────
    es: {
      title: 'Términos de Uso',
      updated: '22 de mayo de 2026',
      tldr: {
        heading: '📋 Resumen rápido (TL;DR)',
        items: [
          '🎓 MindEV-IA es una herramienta educativa de diagnóstico — no reemplaza a un psicólogo ni coach profesional.',
          '🔞 Debes tener 18 años o más para usar el servicio.',
          '👤 Una cuenta por persona. No puedes compartir ni transferir tu acceso.',
          '📅 El plan anual da acceso por 12 meses desde la fecha de pago.',
          '🧠 El perfil IA generado con tus respuestas es tuyo. El contenido de la plataforma (preguntas, metodología) es de MindEV-IA.',
          '⚖️ Ley aplicable: legislación chilena.',
        ],
      },
      sections: [
        {
          title: '1. Descripción del servicio',
          body: `MindEV-IA es una plataforma de diagnóstico mental y técnico para jugadores de póker Texas Hold'em, que utiliza inteligencia artificial para generar perfiles personalizados de mejora.<br><br>
<b>Importante:</b> MindEV-IA es una herramienta de autoconocimiento y educación. <u>No constituye asesoramiento psicológico, médico, financiero ni de ningún tipo profesional</u>. Los resultados son orientativos.`,
        },
        {
          title: '2. Elegibilidad',
          body: `Para usar MindEV-IA debes:<br>
• Tener al menos <b>18 años</b> de edad.<br>
• Tener capacidad legal para contratar en tu país de residencia.<br>
• Proporcionar información verídica durante el registro.`,
        },
        {
          title: '3. Tu cuenta',
          body: `• Eres responsable de mantener tu contraseña segura y confidencial.<br>
• <b>No puedes compartir, vender ni transferir tu cuenta</b> a otra persona.<br>
• Permitimos una sola cuenta por persona.<br>
• Puedes solicitar la eliminación de tu cuenta en cualquier momento escribiéndonos.`,
        },
        {
          title: '4. Pagos y acceso',
          body: `• El <b>plan anual</b> otorga acceso por 12 meses desde la fecha de pago.<br>
• Los <b>cupones de acceso</b> tienen la duración especificada al momento de su entrega.<br>
• Los pagos se procesan de forma segura mediante Stripe o MercadoPago.<br>
• <b>No ofrecemos reembolsos</b> una vez activado el acceso, salvo que la legislación de tu país lo exija expresamente.`,
        },
        {
          title: '5. Usos prohibidos',
          body: `Queda prohibido:<br>
• Registrarse con datos falsos o suplantar la identidad de otra persona.<br>
• Intentar acceder a datos, cuentas o sistemas de otros usuarios.<br>
• Manipular o automatizar el test para obtener resultados artificiales.<br>
• Compartir, revender o publicar el contenido propietario de la plataforma sin autorización.<br>
• Usar el servicio para fines ilegales o que violen derechos de terceros.`,
        },
        {
          title: '6. Propiedad intelectual',
          body: `Las preguntas, metodología, diseño, interfaces y código de MindEV-IA son propiedad de <b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br><br>
El <b>perfil IA generado</b> a partir de tus respuestas personales te pertenece a ti. Puedes descargarlo y usarlo libremente.`,
        },
        {
          title: '7. Limitación de responsabilidad',
          body: `MindEV-IA no se responsabiliza por:<br>
• Decisiones que tomes basándote en los resultados del diagnóstico.<br>
• Pérdidas económicas en el juego derivadas del uso del servicio.<br>
• Interrupciones del servicio por causas fuera de nuestro control (fuerza mayor, fallos de proveedores externos).<br><br>
En ningún caso nuestra responsabilidad total superará el monto que pagaste por el servicio.`,
        },
        {
          title: '8. Modificaciones del servicio',
          body: `Nos reservamos el derecho de modificar, actualizar o discontinuar funcionalidades del servicio. Te notificaremos con anticipación razonable en caso de cambios importantes.`,
        },
        {
          title: '9. Ley aplicable y jurisdicción',
          body: `Estos términos se rigen por las leyes de la <b>República de Chile</b>. Cualquier disputa se someterá a los tribunales ordinarios de justicia de Chile.<br><br>
Para usuarios en <b>Brasil</b>, se aplica adicionalmente la LGPD (Lei 13.709/2018) en lo relativo a protección de datos personales.`,
        },
      ],
    },

    // ── English ──────────────────────────────────────────────────────────────
    en: {
      title: 'Terms of Use',
      updated: 'May 22, 2026',
      tldr: {
        heading: '📋 Quick Summary (TL;DR)',
        items: [
          '🎓 MindEV-IA is an educational diagnostic tool — it does not replace a psychologist or professional coach.',
          '🔞 You must be 18 or older to use the service.',
          '👤 One account per person. You cannot share or transfer your access.',
          '📅 The annual plan grants access for 12 months from the payment date.',
          '🧠 The AI profile generated from your answers belongs to you. The platform content (questions, methodology) belongs to MindEV-IA.',
          '⚖️ Governing law: Republic of Chile.',
        ],
      },
      sections: [
        {
          title: '1. Service Description',
          body: `MindEV-IA is a mental and technical diagnostic platform for Texas Hold'em poker players that uses artificial intelligence to generate personalized improvement profiles.<br><br>
<b>Important:</b> MindEV-IA is a self-awareness and educational tool. <u>It does not constitute psychological, medical, financial, or any other kind of professional advice</u>. Results are for guidance purposes only.`,
        },
        {
          title: '2. Eligibility',
          body: `To use MindEV-IA you must:<br>
• Be at least <b>18 years old</b>.<br>
• Have legal capacity to enter into contracts in your country of residence.<br>
• Provide truthful information during registration.`,
        },
        {
          title: '3. Your Account',
          body: `• You are responsible for keeping your password secure and confidential.<br>
• <b>You may not share, sell, or transfer your account</b> to another person.<br>
• We allow one account per person.<br>
• You can request account deletion at any time by contacting us.`,
        },
        {
          title: '4. Payments and Access',
          body: `• The <b>annual plan</b> grants access for 12 months from the payment date.<br>
• <b>Access coupons</b> are valid for the duration specified at the time of delivery.<br>
• Payments are processed securely via Stripe or MercadoPago.<br>
• <b>We do not offer refunds</b> once access is activated, unless required by the laws of your country.`,
        },
        {
          title: '5. Prohibited Uses',
          body: `The following are prohibited:<br>
• Registering with false information or impersonating another person.<br>
• Attempting to access other users' data, accounts, or systems.<br>
• Manipulating or automating the test to obtain artificial results.<br>
• Sharing, reselling, or publishing the platform's proprietary content without authorization.<br>
• Using the service for illegal purposes or in ways that violate third-party rights.`,
        },
        {
          title: '6. Intellectual Property',
          body: `The questions, methodology, design, interfaces, and code of MindEV-IA are the property of <b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br><br>
The <b>AI profile generated</b> from your personal answers belongs to you. You may download and use it freely.`,
        },
        {
          title: '7. Limitation of Liability',
          body: `MindEV-IA is not responsible for:<br>
• Decisions you make based on the diagnostic results.<br>
• Financial losses at the poker table arising from use of the service.<br>
• Service interruptions due to causes beyond our control (force majeure, third-party provider failures).<br><br>
In no event shall our total liability exceed the amount you paid for the service.`,
        },
        {
          title: '8. Service Modifications',
          body: `We reserve the right to modify, update, or discontinue service features. We will give reasonable advance notice of any significant changes.`,
        },
        {
          title: '9. Governing Law and Jurisdiction',
          body: `These terms are governed by the laws of the <b>Republic of Chile</b>. Any dispute shall be submitted to the ordinary courts of Chile.<br><br>
For users in <b>Brazil</b>, the LGPD (Lei 13.709/2018) additionally applies with respect to personal data protection.<br><br>
For users in the <b>UK / EU</b>, UK GDPR / EU GDPR additionally applies with respect to personal data rights.`,
        },
      ],
    },

    // ── Português ─────────────────────────────────────────────────────────────
    pt: {
      title: 'Termos de Uso',
      updated: '22 de maio de 2026',
      tldr: {
        heading: '📋 Resumo Rápido (TL;DR)',
        items: [
          '🎓 O MindEV-IA é uma ferramenta educacional de diagnóstico — não substitui um psicólogo ou coach profissional.',
          '🔞 Você deve ter 18 anos ou mais para usar o serviço.',
          '👤 Uma conta por pessoa. Você não pode compartilhar ou transferir seu acesso.',
          '📅 O plano anual concede acesso por 12 meses a partir da data do pagamento.',
          '🧠 O perfil de IA gerado com suas respostas é seu. O conteúdo da plataforma (perguntas, metodologia) pertence ao MindEV-IA.',
          '⚖️ Lei aplicável: República do Chile, com aplicação adicional da LGPD para usuários no Brasil.',
        ],
      },
      sections: [
        {
          title: '1. Descrição do Serviço',
          body: `O MindEV-IA é uma plataforma de diagnóstico mental e técnico para jogadores de Texas Hold'em que utiliza inteligência artificial para gerar perfis personalizados de melhoria.<br><br>
<b>Importante:</b> o MindEV-IA é uma ferramenta de autoconhecimento e educação. <u>Não constitui aconselhamento psicológico, médico, financeiro ou de qualquer outra natureza profissional</u>. Os resultados são orientativos.`,
        },
        {
          title: '2. Elegibilidade',
          body: `Para usar o MindEV-IA você deve:<br>
• Ter pelo menos <b>18 anos</b> de idade.<br>
• Ter capacidade legal para contratar em seu país de residência.<br>
• Fornecer informações verdadeiras durante o cadastro.`,
        },
        {
          title: '3. Sua Conta',
          body: `• Você é responsável por manter sua senha segura e confidencial.<br>
• <b>Você não pode compartilhar, vender ou transferir sua conta</b> para outra pessoa.<br>
• Permitimos apenas uma conta por pessoa.<br>
• Você pode solicitar a exclusão de sua conta a qualquer momento entrando em contato conosco.`,
        },
        {
          title: '4. Pagamentos e Acesso',
          body: `• O <b>plano anual</b> concede acesso por 12 meses a partir da data do pagamento.<br>
• Os <b>cupons de acesso</b> têm a duração especificada no momento da entrega.<br>
• Os pagamentos são processados com segurança pela Stripe ou MercadoPago.<br>
• <b>Não oferecemos reembolsos</b> após a ativação do acesso, salvo exigência da legislação do seu país (incluindo o Código de Defesa do Consumidor brasileiro).`,
        },
        {
          title: '5. Usos Proibidos',
          body: `É proibido:<br>
• Cadastrar-se com dados falsos ou se passar por outra pessoa.<br>
• Tentar acessar dados, contas ou sistemas de outros usuários.<br>
• Manipular ou automatizar o teste para obter resultados artificiais.<br>
• Compartilhar, revender ou publicar o conteúdo proprietário da plataforma sem autorização.<br>
• Usar o serviço para fins ilegais ou que violem direitos de terceiros.`,
        },
        {
          title: '6. Propriedade Intelectual',
          body: `As perguntas, metodologia, design, interfaces e código do MindEV-IA são propriedade de <b>Desarrollo de Software Claudio Mauricio Aguilar Figueroa E.I.R.L.</b><br><br>
O <b>perfil de IA gerado</b> a partir de suas respostas pessoais pertence a você. Você pode baixá-lo e usá-lo livremente.`,
        },
        {
          title: '7. Limitação de Responsabilidade',
          body: `O MindEV-IA não se responsabiliza por:<br>
• Decisões que você tome com base nos resultados do diagnóstico.<br>
• Perdas financeiras no jogo decorrentes do uso do serviço.<br>
• Interrupções do serviço por causas fora de nosso controle (força maior, falhas de fornecedores externos).<br><br>
Em nenhuma hipótese nossa responsabilidade total superará o valor pago pelo serviço.`,
        },
        {
          title: '8. Modificações do Serviço',
          body: `Reservamo-nos o direito de modificar, atualizar ou descontinuar funcionalidades do serviço. Notificaremos você com antecedência razoável em caso de mudanças significativas.`,
        },
        {
          title: '9. Lei Aplicável e Jurisdição',
          body: `Estes termos são regidos pelas leis da <b>República do Chile</b>. Qualquer disputa será submetida aos tribunais ordinários do Chile.<br><br>
Para usuários no <b>Brasil</b>, aplica-se adicionalmente a <b>LGPD (Lei 13.709/2018)</b> em relação à proteção de dados pessoais. Em caso de litígio sobre dados pessoais, o usuário brasileiro poderá também recorrer à ANPD (Autoridade Nacional de Proteção de Dados).`,
        },
      ],
    },
  },
};

// ─── Renderizar modal legal ───────────────────────────────────────────────────
function openLegalModal(activeTab = 'privacy') {
  document.getElementById('legal-modal')?.remove();

  const lang = I18N.isEN() ? 'en' : I18N.isPT() ? 'pt' : 'es';

  function renderTab(tabKey) {
    const content = LEGAL[tabKey][lang];
    const tldr = content.tldr;
    const sections = content.sections;

    return `
      <div style="padding:0 24px 24px">
        <!-- TL;DR -->
        <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;margin-bottom:28px">
          <div style="font-weight:700;color:var(--accent);margin-bottom:12px;font-size:1rem">${tldr.heading}</div>
          <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px">
            ${tldr.items.map(i => `<li style="color:var(--text2);font-size:0.9rem;line-height:1.5">${i}</li>`).join('')}
          </ul>
        </div>
        <!-- Secciones completas -->
        ${sections.map(s => `
          <div style="margin-bottom:24px">
            <div style="font-weight:700;color:var(--text1);margin-bottom:8px;font-size:0.95rem">${s.title}</div>
            <div style="color:var(--text2);font-size:0.88rem;line-height:1.7">${s.body}</div>
          </div>`).join('<hr style="border:none;border-top:1px solid var(--border);margin:20px 0">')}
        <!-- Fecha de actualización -->
        <div style="margin-top:28px;padding-top:16px;border-top:1px solid var(--border);color:var(--text3);font-size:0.78rem">
          ${lang === 'pt' ? 'Última atualização' : lang === 'en' ? 'Last updated' : 'Última actualización'}: ${content.updated}
        </div>
      </div>`;
  }

  const labPrivacy = lang === 'en' ? '🔒 Privacy Policy' : lang === 'pt' ? '🔒 Privacidade' : '🔒 Privacidad';
  const labTerms   = lang === 'en' ? '📄 Terms of Use'   : lang === 'pt' ? '📄 Termos de Uso' : '📄 Términos de Uso';

  const overlay = document.createElement('div');
  overlay.id = 'legal-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;overflow-y:auto';

  overlay.innerHTML = `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:16px;max-width:680px;width:100%;margin:auto;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.6)">
      <!-- Header -->
      <div style="position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--border);border-radius:16px 16px 0 0;z-index:1;padding:20px 24px 0">
        <button onclick="document.getElementById('legal-modal').remove()"
          style="position:absolute;top:16px;right:20px;background:none;border:none;color:var(--text3);cursor:pointer;font-size:1.6rem;line-height:1">✕</button>
        <div style="font-size:1.1rem;font-weight:700;color:var(--text1);margin-bottom:16px">
          ⚖️ ${lang === 'en' ? 'Legal' : 'Legal'} — MindEV-IA
        </div>
        <!-- Tabs -->
        <div style="display:flex;gap:8px">
          <button id="leg-tab-privacy" onclick="legalSwitchTab('privacy')"
            style="padding:8px 18px;border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all 0.15s;
                   background:${activeTab==='privacy'?'var(--card)':'transparent'};
                   color:${activeTab==='privacy'?'var(--accent)':'var(--text3)'}">
            ${labPrivacy}
          </button>
          <button id="leg-tab-terms" onclick="legalSwitchTab('terms')"
            style="padding:8px 18px;border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all 0.15s;
                   background:${activeTab==='terms'?'var(--card)':'transparent'};
                   color:${activeTab==='terms'?'var(--accent)':'var(--text3)'}">
            ${labTerms}
          </button>
        </div>
      </div>
      <!-- Body -->
      <div id="legal-modal-body" style="padding-top:24px">
        ${renderTab(activeTab)}
      </div>
    </div>`;

  // Cerrar al click fuera del card
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  // Guardar renderTab para re-uso en el switch de tabs
  overlay._renderTab = renderTab;
}

function legalSwitchTab(tab) {
  const overlay = document.getElementById('legal-modal');
  if (!overlay) return;
  const lang = I18N.isEN() ? 'en' : I18N.isPT() ? 'pt' : 'es';

  // Actualizar estilos de tabs
  ['privacy','terms'].forEach(t => {
    const btn = document.getElementById(`leg-tab-${t}`);
    if (!btn) return;
    btn.style.background = t === tab ? 'var(--card)' : 'transparent';
    btn.style.color = t === tab ? 'var(--accent)' : 'var(--text3)';
  });

  // Re-renderizar body
  const content = LEGAL[tab][lang];
  const tldr = content.tldr;
  const sections = content.sections;

  document.getElementById('legal-modal-body').innerHTML = `
    <div style="padding:0 24px 24px">
      <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:20px;margin-bottom:28px">
        <div style="font-weight:700;color:var(--accent);margin-bottom:12px;font-size:1rem">${tldr.heading}</div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px">
          ${tldr.items.map(i => `<li style="color:var(--text2);font-size:0.9rem;line-height:1.5">${i}</li>`).join('')}
        </ul>
      </div>
      ${sections.map(s => `
        <div style="margin-bottom:24px">
          <div style="font-weight:700;color:var(--text1);margin-bottom:8px;font-size:0.95rem">${s.title}</div>
          <div style="color:var(--text2);font-size:0.88rem;line-height:1.7">${s.body}</div>
        </div>`).join('<hr style="border:none;border-top:1px solid var(--border);margin:20px 0">')}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid var(--border);color:var(--text3);font-size:0.78rem">
        ${lang === 'pt' ? 'Última atualização' : lang === 'en' ? 'Last updated' : 'Última actualización'}: ${content.updated}
      </div>
    </div>`;

  // Scroll al inicio del modal
  overlay.scrollTo({ top: 0, behavior: 'smooth' });
}
