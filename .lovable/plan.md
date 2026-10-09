# Mostrar QR code e chave para conectar no celular

## Situacao
O QR code some da tela de login depois do primeiro acesso (flag `totp_configurado = 'sim'`). O painel de recuperacao em Configuracoes ja existe, mas exige estar logado, e voce esta bloqueado na tela de login.

## O que sera feito
1. Redefinir a flag `totp_configurado` para `nao` no banco, para o QR code e a chave de texto voltarem a aparecer em /auth.
2. Conferir em /auth que aparecem: QR code (Google Authenticator), chave manual em texto (copiavel) e a contagem de 30s.
3. Garantir que a chave manual em texto aparece junto do QR na tela de login (adicionar se faltar).
4. Depois do primeiro login com codigo correto, o QR some de novo; para rever, use Configuracoes > Acesso (Google Authenticator).

## Detalhes tecnicos
- Update em `public.configuracoes` (chave `totp_configurado`).
- Possivel ajuste em `src/routes/auth.tsx` para exibir a chave base32.
- O segredo continua derivado de SESSION_SECRET, entao o QR sera o mesmo de antes (se ja tinha adicionado no celular, o codigo atual continua valido).

Aviso: enquanto o QR estiver visivel, qualquer pessoa que abrir /auth consegue ve-lo. Faca o cadastro logo.
