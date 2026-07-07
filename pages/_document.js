// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const hero = '/hero.jpg'

    return (
      <Html lang="en" className="dark">
        <Head>
          {/* Preconnects */}
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />

          {/* Preload LCP image (hero) */}
          <link rel="preload" as="image" href={hero} />

          {/* Preload the self-hosted Geist Sans variable font */}
          <link rel="preload" as="font" href="/fonts/Geist-Variable.woff2" type="font/woff2" crossOrigin="anonymous" />
        </Head>
        <body className="bg-black text-white antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
