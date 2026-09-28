# 📱 Guia de Compilação e Uso Mobile (Android & iOS)

Este projeto de Controle Financeiro foi projetado para rodar perfeitamente em dispositivos móveis tanto como **PWA (Instalação Direta)** quanto como **Aplicativo Nativo (Android APK / iOS App Store)**.

---

## 🚀 Opção 1: Instalação Instantânea PWA (Sem Compilação)

O PWA permite que qualquer usuário instale o app diretamente pelo navegador do celular com ícone na tela inicial, modo tela cheia e performance nativa.

### 🤖 No Android (Google Chrome):
1. Abra a URL do sistema no Chrome (`http://seu-ip:8000` ou seu domínio online).
2. Toque nos **3 pontinhos** no canto superior direito.
3. Selecione **"Adicionar à Tela inicial"** ou **"Instalar aplicativo"**.

### 🍏 No iOS / iPhone (Safari):
1. Abra a URL do sistema no Safari.
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima no rodapé).
3. Role e selecione **"Adicionar à Tela de Início"**.

---

## 🛠️ Opção 2: Gerar Aplicativo Nativo (.APK para Android / .IPA para iOS via Capacitor)

Para gerar os pacotes nativos para publicação na Google Play Store ou Apple App Store:

### Pré-requisitos:
- [Node.js](https://nodejs.org/) (v18+)
- Para Android: [Android Studio](https://developer.android.com/studio)
- Para iOS: macOS com [Xcode](https://developer.apple.com/xcode/)

### Passo a Passo:

1. **Instalar as dependências do Capacitor:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

2. **Inicializar o projeto Capacitor:**
```bash
npx cap init "Controle Financeiro" "com.controlefinanceiro.app" --web-dir "../frontend"
```

3. **Adicionar a plataforma Android:**
```bash
npx cap add android
npx cap open android
```
*O Android Studio será aberto automaticamente. Basta clicar em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.*

4. **Adicionar a plataforma iOS (apenas no Mac):**
```bash
npx cap add ios
npx cap open ios
```
*O Xcode abrirá o projeto nativo para compilação e teste no simulador ou dispositivo físico.*
