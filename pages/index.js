import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Intro from '@/components/Intro'
import SplitBlock from '@/components/SplitBlock'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />
      <Hero />
      <Intro />
      <SplitBlock />
      <Footer />
    </div>
  )
}
